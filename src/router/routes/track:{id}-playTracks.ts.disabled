import { Request, Response } from "express";
import { ReadStream } from "fs";
import { OutgoingHttpHeaders } from "http";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import ytdl from "ytdl-core";
import { Readable } from "stream";

/**
 * @description parses the range header & send as {start, end}
 * @author KR Tirtho
 * @param {(string | null | undefined)} range
 * @param {number} contentLength
 * @return {*}  {({ start: number; end: number } | null)}
 */
function readRange(range: string | null | undefined, contentLength: number): { start: number; end: number } | null {
  if (!range || range.length === 0) {
    return null;
  }

  /** @returns ["...", start, end, total] */
  const rangeArr = range.split(/bytes=([0-9]*)-([0-9]*)/);

  const start = parseInt(rangeArr[1]);
  const end = parseInt(rangeArr[2]);

  const result = {
    start: isNaN(start) ? 0 : start,
    end: isNaN(end) ? 0 : end,
  };

  /**
   * if start is defined but not end then send
   * all the content from that start-point to end
   */

  if (!isNaN(start) && isNaN(end)) {
    result.start = start;
    result.end = contentLength - 1;
  }
  /**
   * if end is defined but not start then send all the content
   * from that end-point to rest of the bytes
   */

  if (isNaN(start) && !isNaN(end)) {
    result.start = contentLength - end;
    result.end = contentLength - 1;
  }

  return result;
}

interface SendResponseOptions {
  status: number;
  headers?: OutgoingHttpHeaders;
  contentReadable?: Readable;
}

/**
 * @description sends response back for partial content
 * @author KR Tirtho
 * @param {Response} res
 * @param {SendResponseOptions} { status, headers, contentReadable }
 * @return {*}  {(ReadStream | null | void)}
 */
function sendResponse(res: Response, { status, headers, contentReadable }: SendResponseOptions): ReadStream | Response | null | void {
  res.writeHead(status, getReasonPhrase(status), headers);
  if (!contentReadable) res.end(status.toString());
  else contentReadable.pipe(res);
  return null;
}

export default async function playTracks(req: Request<{ id: string; tid: string }>, res: Response): Promise<null | void> {
  try {
    const url = `https://www.youtube.com/watch?v=${req.params.tid}`;
    if (!req.params.tid) {
      sendResponse(res, { status: StatusCodes.BAD_REQUEST });
      return null;
    }
    const videoInfo = await ytdl.getInfo(url);
    const mp4Audio = videoInfo.formats.find((format) => format.itag === 140);
    const mimeType = mp4Audio?.mimeType?.split(" ")[0].replace(";", "");
    // No file found
    if (!videoInfo) {
      sendResponse(res, { status: StatusCodes.NOT_FOUND });
      return null;
    }
    const headers: OutgoingHttpHeaders = {};
    const musicSize = parseInt(mp4Audio?.contentLength ?? "0");

    console.log("req.headers:", req.headers);
    const range = readRange(req.headers["range"], musicSize);

    // no range headers
    // send the entire file
    if (!range) {
      headers["Content-Type"] = mimeType || "audio/mp4";
      headers["Content-Length"] = musicSize;
      headers["Accept-Ranges"] = "bytes";
      // sending only info about the track
      sendResponse(res, { status: StatusCodes.OK, headers });
      return null;
    }

    // when no content/stream is available send 416 {REQUESTED_RANGE_NOT_SATISFIABLE}
    if (range.start >= musicSize || range.end >= musicSize) {
      headers["Content-Length"] = "bytes";

      sendResponse(res, { status: StatusCodes.REQUESTED_RANGE_NOT_SATISFIABLE, headers });
      return null;
    }

    headers["Content-Range"] = `bytes ${range.start}-${range.end}/${musicSize}`; // e.g: "bytes 1024-2047/3042"
    headers["Content-Length"] = range.start === range.end ? 0 : range.end - range.start + 1;
    console.log('musicSize:', musicSize)
    console.log('headers["Content-Length"]:', headers["Content-Length"])
    headers["Content-Type"] = mimeType;
    headers["Accept-Ranges"] = "bytes";
    headers["Cache-Control"] = "no-cache";

    // a fine response
    sendResponse(res, { status: StatusCodes.PARTIAL_CONTENT, headers, contentReadable: ytdl(url, { format: mp4Audio, range: { start: range.start, end: range.end } }) });
  } catch (error) {
    sendResponse(res, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}
