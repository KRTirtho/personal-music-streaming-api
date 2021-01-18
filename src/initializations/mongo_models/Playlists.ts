import "reflect-metadata";
import { getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";
import { SpotifyPlaylists } from "../spotify_api";
import { AnyParamConstructor, DocumentType } from "@typegoose/typegoose/lib/types";
import { Model } from "mongoose";

export class PlaylistTrack {
  @prop({ required: true })
  public name!: string;
  @prop({ required: true })
  public artists!: string;
  @prop({ required: true })
  public url!: string;
}

@modelOptions({options:{allowMixed: Severity.ALLOW}})
export class PlaylistSchema {
  @prop({ required: true, enum: SpotifyPlaylists })
  public name!: SpotifyPlaylists;
  @prop({ _id: false })
  public tracks!: PlaylistTrack[];
}

const Playlist: Model<DocumentType<InstanceType<AnyParamConstructor<PlaylistSchema>>>> & AnyParamConstructor<PlaylistSchema> = getModelForClass<AnyParamConstructor<PlaylistSchema>>(PlaylistSchema);

export default Playlist;
