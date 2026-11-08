"""zipalign minimal en Python : aligne sur 4 octets les entrées non compressées
(resources.arsc, png) comme l'exige Android 11+ (targetSdk >= 30)."""
import struct
import sys
import zipfile

src, dst = sys.argv[1], sys.argv[2]
ALIGN = 4

with zipfile.ZipFile(src) as zin, open(dst, "wb") as out:
    central = []
    for info in zin.infolist():
        raw = zin.open(info)  # données décompressées
        data = raw.read()
        name = info.filename.encode("utf-8")
        method = info.compress_type
        if method == zipfile.ZIP_DEFLATED:
            import zlib
            co = zlib.compressobj(9, zlib.DEFLATED, -15)
            payload = co.compress(data) + co.flush()
        else:
            method = zipfile.ZIP_STORED
            payload = data
        crc = zipfile.crc32(data) & 0xFFFFFFFF
        offset = out.tell()
        extra = b""
        if method == zipfile.ZIP_STORED:
            data_start = offset + 30 + len(name)
            pad = (-data_start) % ALIGN
            extra = b"\x00" * pad
        header = struct.pack("<IHHHHHIIIHH", 0x04034B50, 20, 0x0800, method, 0, 0x21,
                             crc, len(payload), len(data), len(name), len(extra))
        out.write(header + name + extra + payload)
        central.append((name, method, crc, len(payload), len(data), offset))
    cd_start = out.tell()
    for name, method, crc, csize, usize, offset in central:
        out.write(struct.pack("<IHHHHHHIIIHHHHHII", 0x02014B50, 20, 20, 0x0800, method, 0, 0x21,
                              crc, csize, usize, len(name), 0, 0, 0, 0, 0, offset) + name)
    cd_size = out.tell() - cd_start
    out.write(struct.pack("<IHHHHIIH", 0x06054B50, 0, 0, len(central), len(central), cd_size, cd_start, 0))
print("aligné :", dst)
