import "reflect-metadata";
import { DocumentType, getModelForClass, prop } from "@typegoose/typegoose";
import { Model } from "mongoose";
import { AnyParamConstructor } from "@typegoose/typegoose/lib/types";

export class UserSchema {
  @prop({ required: true })
  public username!: string;
  @prop({ required: true, unique: true })
  public email!: string;
  @prop({ required: true, unique:true })
  public spotifyId!: string;
  @prop({ required: true })
  public spotifyRefreshToken!: string;
}

const User: Model<DocumentType<InstanceType<AnyParamConstructor<UserSchema>>>> & AnyParamConstructor<UserSchema> = getModelForClass<AnyParamConstructor<UserSchema>>(UserSchema);

export default User;
