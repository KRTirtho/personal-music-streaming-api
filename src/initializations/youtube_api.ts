import { YOUTUBE_DATA_API_KEY } from "../conf";
import ytScraper, { Video } from "scrape-yt";

export function youtubeScrapSearch(query: string) {
  return new Promise<Video[]>((resolve) => {
    setTimeout(() => resolve(ytScraper.search(query, { limit: 10, type: "video" })), 150);
  });
}
