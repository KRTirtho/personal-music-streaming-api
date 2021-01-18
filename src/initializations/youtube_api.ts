import { youtube_v3 } from "googleapis";
import { YOUTUBE_DATA_API_KEY } from "../conf";
import ytScraper, { Video } from "scrape-yt";

export const youtubeApiSearch = async (query: string) => {
  const searchConfs: youtube_v3.Params$Resource$Search$List = {
    key: YOUTUBE_DATA_API_KEY,
    q: query,
    part: ["snippet"],
    maxResults: 10,
    type: ["video"],
    videoCategoryId: "10",
  };

  const queryResult = await new youtube_v3.Youtube({}).search.list(searchConfs);

  return queryResult;
};

export function youtubeScrapSearch(query: string) {
  return new Promise<Video[]>((resolve) => {
    setTimeout(() => resolve(ytScraper.search(query, { limit: 10, type: "video" })), 150);
  });
}
