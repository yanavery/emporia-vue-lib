export class Customer {
  public customerGid: number = 0;
  public email: string = '';
  public firstName: string = '';
  public lastName: string = '';
  public createdAt: Date = new Date(0);

  constructor(
    gid: number = 0,
    email: string = '',
    firstName: string = '',
    lastName: string = '',
    createdAt: Date = new Date(0)
  ) {
    this.customerGid = gid;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.createdAt = createdAt;
  }

  public fromJsonDictionary(js: any): this {
    if (js.customerGid !== undefined) {
      this.customerGid = js.customerGid;
    }
    if (js.email !== undefined) {
      this.email = js.email;
    }
    if (js.firstName !== undefined) {
      this.firstName = js.firstName;
    }
    if (js.lastName !== undefined) {
      this.lastName = js.lastName;
    }
    if (js.createdAt !== undefined) {
      this.createdAt = new Date(js.createdAt);
    }
    return this;
  }
}