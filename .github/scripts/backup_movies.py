"""Firestore의 영화 기록을 사이트의 예전 '백업 내려받기'와 같은 형식의 JSON으로 저장합니다."""
import json
import sys
import urllib.parse
import urllib.request

PROJECT = "my-first-page-931dd"
COLLECTION = "myMoviesGallery"
URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/{COLLECTION}"


def plain(value):
    kind, inner = next(iter(value.items()))
    if kind == "integerValue":
        return int(inner)
    if kind == "doubleValue":
        return float(inner)
    if kind == "nullValue":
        return None
    if kind == "arrayValue":
        return [plain(v) for v in inner.get("values", [])]
    if kind == "mapValue":
        return {k: plain(v) for k, v in inner.get("fields", {}).items()}
    return inner


def fetch_all():
    docs, token = [], ""
    while True:
        query = {"pageSize": 300}
        if token:
            query["pageToken"] = token
        with urllib.request.urlopen(f"{URL}?{urllib.parse.urlencode(query)}", timeout=60) as res:
            page = json.load(res)
        for d in page.get("documents", []):
            item = {"id": d["name"].rsplit("/", 1)[-1]}
            item.update({k: plain(v) for k, v in d.get("fields", {}).items()})
            docs.append(item)
        token = page.get("nextPageToken")
        if not token:
            return docs


def main(path):
    docs = fetch_all()
    if not docs:
        sys.exit("기록을 하나도 받지 못해 백업을 멈춥니다.")
    docs.sort(key=lambda d: d["id"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    watched = sum(1 for d in docs if d.get("status") != "watchlist")
    print(f"{len(docs)}개 저장 (본 영화 {watched}, 보고 싶은 영화 {len(docs) - watched})")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "movies_backup.json")
