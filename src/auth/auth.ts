import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { CognitoUser, CognitoUserPool, CognitoUserAttribute, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

const CLIENT_ID = '4qte47jbstod8apnfic0bunmrq';
const USER_POOL_ID = 'us-east-2_ghlOXVLi1';
const USER_POOL_URL = `https://cognito-idp.us-east-2.amazonaws.com/${USER_POOL_ID}`;

export interface TokenSet {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  tokenType?: string;
}

export interface AuthConfig {
  host: string;
  username?: string;
  password?: string;
  connectTimeout?: number;
  readTimeout?: number;
  tokens?: TokenSet;
  tokenUpdater?: (tokens: TokenSet) => void;
  maxRetryAttempts?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
}

export class Auth {
  protected host: string;
  protected connectTimeout: number;
  protected readTimeout: number;
  protected tokenUpdater?: (tokens: TokenSet) => void;
  protected maxRetryAttempts: number;
  protected initialRetryDelay: number;
  protected maxRetryDelay: number;
  protected poolWellknownJwks?: any;
  protected tokens: TokenSet = {};
  protected password?: string;
  protected cognitoUser?: CognitoUser;
  protected userPool: CognitoUserPool;

  constructor(config: AuthConfig) {
    this.host = config.host;
    this.connectTimeout = config.connectTimeout || 6.03;
    this.readTimeout = config.readTimeout || 10.03;
    this.tokenUpdater = config.tokenUpdater;
    this.maxRetryAttempts = Math.max(config.maxRetryAttempts || 5, 1);
    this.initialRetryDelay = Math.max(config.initialRetryDelay || 0.5, 0.5);
    this.maxRetryDelay = Math.max(config.maxRetryDelay || 30.0, 0);

    this.userPool = new CognitoUserPool({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
    });

    if (
      config.tokens &&
      config.tokens.accessToken &&
      config.tokens.idToken &&
      config.tokens.refreshToken
    ) {
      this.tokens = config.tokens;
      if (config.username) {
        this.cognitoUser = new CognitoUser({
          Username: config.username,
          Pool: this.userPool,
        });
      }
    } else if (config.username && config.password) {
      this.password = config.password;
      this.cognitoUser = new CognitoUser({
        Username: config.username,
        Pool: this.userPool,
      });
    }
  }

  public async refreshTokens(): Promise<TokenSet> {
    return new Promise((resolve, reject) => {
      if (this.password && this.cognitoUser) {
        const authDetails = new AuthenticationDetails({
          Username: this.cognitoUser.getUsername(),
          Password: this.password,
        });

        this.cognitoUser.authenticateUser(authDetails, {
          onSuccess: (result) => {
            const tokens = {
              accessToken: result.getAccessToken().getJwtToken(),
              idToken: result.getIdToken().getJwtToken(),
              refreshToken: result.getRefreshToken().getToken(),
              tokenType: 'Bearer',
            };
            this.tokens = tokens;
            this.password = undefined;
            if (this.tokenUpdater) {
              this.tokenUpdater(tokens);
            }
            resolve(tokens);
          },
          onFailure: (err) => {
            reject(err);
          },
        });
      } else if (this.tokens.refreshToken && this.cognitoUser) {
        const refreshToken = this.userPool.getCurrentUser()?.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            reject(err);
            return;
          }
          if (session) {
            const tokens = {
              accessToken: session.getAccessToken().getJwtToken(),
              idToken: session.getIdToken().getJwtToken(),
              refreshToken: session.getRefreshToken().getToken(),
              tokenType: 'Bearer',
            };
            this.tokens = tokens;
            if (this.tokenUpdater) {
              this.tokenUpdater(tokens);
            }
            resolve(tokens);
          }
        });
      } else {
        reject(new Error('No valid authentication method available'));
      }
    });
  }

  public getTokens(): TokenSet {
    return this.tokens;
  }

  public getUsername(): string {
    return this.cognitoUser?.getUsername() || '';
  }

  public async request(
    method: string,
    path: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    if (!this.tokens || !this.tokens.accessToken) {
      throw new Error('Not authenticated. Incorrect username or password?');
    }

    const decodedAccessToken = this.decodeToken(this.tokens.accessToken);

    let attempts = 0;
    while (attempts < this.maxRetryAttempts) {
      attempts += 1;

      if (Date.now() / 1000 > decodedAccessToken.exp) {
        this.tokens = await this.refreshTokens();
      }

      try {
        let response = await this.doRequest(method, path, config);

        if (response.status === 401) {
          this.tokens = await this.refreshTokens();
          response = await this.doRequest(method, path, config);
        }

        if (response.status >= 500) {
          const delay = Math.min(
            this.initialRetryDelay * Math.pow(2, attempts - 1),
            this.maxRetryDelay
          );
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
          continue;
        }

        if (response.status < 500) {
          return response;
        }
      } catch (error) {
        if (attempts >= this.maxRetryAttempts) {
          throw error;
        }
        const delay = Math.min(
          this.initialRetryDelay * Math.pow(2, attempts - 1),
          this.maxRetryDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  protected async doRequest(
    method: string,
    path: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    const headers = {
      ...config?.headers,
      authtoken: this.tokens.idToken,
    };

    return axios.request({
      method: method as any,
      url: `${this.host}/${path}`,
      ...config,
      headers,
      timeout: this.readTimeout * 1000,
    });
  }

  private decodeToken(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}

export class SimulatedAuth extends Auth {
  constructor(host: string, username?: string, password?: string) {
    super({
      host,
      username,
      password,
      tokens: { idToken: 'simulator' },
    });
  }

  public async refreshTokens(): Promise<TokenSet> {
    return { idToken: 'simulator' };
  }

  public getUsername(): string {
    return this.cognitoUser?.getUsername() || 'simulator';
  }

  public async request(
    method: string,
    path: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    let response = await this.doRequest(method, path, config);

    if (response.status === 401) {
      this.tokens = await this.refreshTokens();
      response = await this.doRequest(method, path, config);
    }

    return response;
  }

  protected async doRequest(
    method: string,
    path: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    const headers = {
      ...config?.headers,
      authtoken: this.tokens.idToken,
    };

    return axios.request({
      method: method as any,
      url: `${this.host}/${path}`,
      ...config,
      headers,
      timeout: this.readTimeout * 1000,
    });
  }
}