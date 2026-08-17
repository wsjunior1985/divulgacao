// mime.js — detecta o content-type de um buffer a partir dos magic bytes.

export function fileTypeFromBuffer(buf) {
  if (buf.length > 3 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff && buf[3] === 0xe0)
    return "image/jpeg";
  if (buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf.length > 2 && buf[0] === 0x42 && buf[1] === 0x4d) return "image/bmp";
  if (buf.length > 2 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46) return "image/webp";
  return "application/octet-stream";
}
