# GlobeMemories — Media Upload Frontend Guide

This guide explains how the photo/video upload system works and how the frontend should interact with it.

---

## How It Works

Files are stored on the server under an `uploads/` folder. The database does **not** store the file itself — it stores a **relative path** like `trip-photos/abc123.jpg`. The file is accessible via a public URL.

Every upload response returns two values you need to keep:

| Field | Example value | Purpose |
|---|---|---|
| `fileUrl` | `trip-photos/abc123.jpg` | **Save this** — it's the key used to delete the file later |
| `publicUrl` | `http://server/files/trip-photos/abc123.jpg` | Use this directly in `<img src>` or `<video src>` |

When you fetch a trip (`GET /trips/:id`), the `photos` and `videos` arrays contain `fileUrl` values (relative paths). To display them, prepend the base URL:

```
http://<server>/files/<fileUrl>
```

---

## General Rules

- All upload/delete endpoints require the `Authorization: Bearer <token>` header.
- Files are uploaded as `multipart/form-data` with the field name `file`.
- **You cannot upload files at trip creation time.** Always: create the entity first → then upload media.
- To replace a photo, delete the old one first, then upload the new one.

### Limits

| Entity | Max photos | Max videos | Notes |
|---|---|---|---|
| Trip | 20 | 3 | — |
| Accommodation | 5 | — | — |
| Reference point | 5 | — | — |
| Food item | 1 | — | Delete before re-uploading |
| Transport entry | 1 | — | Delete before re-uploading |

### Image constraints
- Max size: **5 MB**
- Allowed formats: `jpg`, `jpeg`, `png`, `gif`, `webp`

### Video constraints
- Max size: **100 MB**
- Allowed formats: `mp4`, `webm`, `mov`, `avi`, `mkv`

---

## Creating a Trip and Adding Photos/Videos

This is the most common frontend flow, so it is covered in full detail here.

### Why two steps are required

The API stores photos as a list of file paths on the `Trip` entity. To attach a photo to a trip, the trip must already exist in the database (the server needs a `tripId` to write the path against). There is no way to upload photos and create the trip in a single request.

The recommended UI pattern is a **multi-step form** or a **post-creation upload step**:

```
[Step 1] User fills in trip details (title, dates, description, etc.)
            ↓  POST /trips
         Server creates the trip and returns { id: 32, ... }

[Step 2] User selects photos and videos from their device
            ↓  POST /trips/32/media/photos  (one request per file)
            ↓  POST /trips/32/media/videos  (one request per file)
         Server stores each file and returns { fileUrl, publicUrl }

[Step 3] Display the uploaded media using publicUrl values
```

Each upload is a separate HTTP request. Upload them one at a time (sequential) or all at once (parallel with `Promise.all`) — both work.

### Full TypeScript implementation

```ts
interface TripDto {
  title: string;
  startDate: string; // ISO date
  endDate: string;
  // ... other fields
}

interface UploadedMedia {
  fileUrl: string;    // store this — needed for DELETE
  publicUrl: string;  // use this for <img src> or <video src>
  fileSize: number;
  contentType: string;
}

// Step 1 — Create the trip
async function createTrip(tripData: TripDto, token: string): Promise<{ id: number }> {
  const res = await fetch("/trips", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tripData),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

// Step 2a — Upload a single photo
async function uploadTripPhoto(tripId: number, file: File, token: string): Promise<UploadedMedia> {
  const form = new FormData();
  form.append("file", file);
  // Do NOT set Content-Type manually — browser sets it with the multipart boundary
  const res = await fetch(`/trips/${tripId}/media/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

// Step 2b — Upload a single video
async function uploadTripVideo(tripId: number, file: File, token: string): Promise<UploadedMedia> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/trips/${tripId}/media/videos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

// Orchestrator — create trip then upload all selected media
async function createTripWithMedia(
  tripData: TripDto,
  photos: File[],
  videos: File[],
  token: string,
  onProgress?: (uploaded: number, total: number) => void
) {
  // 1. Create the trip first
  const trip = await createTrip(tripData, token);

  const total = photos.length + videos.length;
  let uploaded = 0;

  // 2. Upload photos sequentially to avoid overwhelming the server
  const uploadedPhotos: UploadedMedia[] = [];
  for (const file of photos) {
    const result = await uploadTripPhoto(trip.id, file, token);
    uploadedPhotos.push(result);
    onProgress?.(++uploaded, total);
  }

  // 3. Upload videos sequentially (they can be large)
  const uploadedVideos: UploadedMedia[] = [];
  for (const file of videos) {
    const result = await uploadTripVideo(trip.id, file, token);
    uploadedVideos.push(result);
    onProgress?.(++uploaded, total);
  }

  return { trip, uploadedPhotos, uploadedVideos };
}
```

### React component example

```tsx
const BASE_FILES_URL = import.meta.env.VITE_FILES_URL ?? "http://localhost:8080/files";

function CreateTripForm({ token }: { token: string }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedMedia[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedMedia[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { trip, uploadedPhotos, uploadedVideos } = await createTripWithMedia(
        { title, startDate, endDate },
        photoFiles,
        videoFiles,
        token,
        (done, total) => setProgress({ done, total })
      );
      setUploadedPhotos(uploadedPhotos);
      setUploadedVideos(uploadedVideos);
      // navigate to trip page, etc.
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={e => setPhotoFiles(Array.from(e.target.files ?? []))}
      />
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/avi,video/x-matroska"
        multiple
        onChange={e => setVideoFiles(Array.from(e.target.files ?? []))}
      />

      <button type="submit" disabled={loading}>
        {loading
          ? progress
            ? `Uploading ${progress.done}/${progress.total}…`
            : "Creating trip…"
          : "Create Trip"}
      </button>

      {/* Preview uploaded photos */}
      {uploadedPhotos.map(p => (
        <img key={p.fileUrl} src={p.publicUrl} alt="Trip photo" width={200} />
      ))}

      {/* Preview uploaded videos */}
      {uploadedVideos.map(v => (
        <video key={v.fileUrl} src={v.publicUrl} controls width={400} />
      ))}
    </form>
  );
}
```

### Editing an existing trip — adding and removing media

When the user edits a trip, fetch the trip first to display existing media, then allow adding/removing:

```tsx
function EditTripMedia({ tripId, token }: { tripId: number; token: string }) {
  const BASE = import.meta.env.VITE_FILES_URL ?? "http://localhost:8080/files";

  // trip.photos = ["trip-photos/abc.jpg", ...]  (fileUrl values)
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(trip => {
        setPhotos(trip.photos ?? []);
        setVideos(trip.videos ?? []);
      });
  }, [tripId]);

  async function addPhoto(file: File) {
    const result = await uploadTripPhoto(tripId, file, token);
    // result.fileUrl is what GET /trips/:id will return later
    setPhotos(prev => [...prev, result.fileUrl]);
  }

  async function removePhoto(fileUrl: string) {
    await fetch(`/trips/${tripId}/media/photos?path=${encodeURIComponent(fileUrl)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPhotos(prev => prev.filter(p => p !== fileUrl));
  }

  return (
    <div>
      {photos.map(fileUrl => (
        <div key={fileUrl}>
          <img src={`${BASE}/${fileUrl}`} alt="Trip photo" width={200} />
          <button onClick={() => removePhoto(fileUrl)}>Remove</button>
        </div>
      ))}

      <input
        type="file"
        accept="image/*"
        onChange={e => e.target.files?.[0] && addPhoto(e.target.files[0])}
      />
    </div>
  );
}
```

**Key point:** `GET /trips/:id` returns `photos` as an array of `fileUrl` values (not full URLs). Prepend `BASE_FILES_URL` to display them. The same values are passed to the delete endpoint as the `path` query parameter.

---

## Step-by-Step Workflows

### 1. Create a trip with photos (summary)

```
Step 1 — Create the trip
POST /trips
Body: { title, startDate, endDate, ... }
Response: { id: 32, ... }

Step 2 — Upload photos one by one
POST /trips/32/media/photos   (repeat for each file)
Body: multipart, field "file" = <image>
Response: { fileUrl, publicUrl, fileSize, contentType }

Step 3 (optional) — Upload videos
POST /trips/32/media/videos
Body: multipart, field "file" = <video>
Response: { fileUrl, publicUrl, fileSize, contentType }
```

### 2. Add a photo to an accommodation

```
Step 1 — Accommodation must already exist
POST /trips/32/accommodations
Response: { id: 10, ... }

Step 2 — Upload photo
POST /trips/32/media/accommodations/10/photos
Body: multipart, field "file" = <image>
Response: { fileUrl, publicUrl }
```

### 3. Add a photo to a food item (max 1)

```
POST /trips/32/media/foods/12/photo
Body: multipart, field "file" = <image>
Response: { fileUrl, publicUrl }

→ If a photo already exists, you get a 400 error.
  Delete first, then upload:

DELETE /trips/32/media/foods/12/photo   (no body needed)
POST   /trips/32/media/foods/12/photo
```

### 4. Add a photo to a transport entry

Transport uses a **composite key**: the `Transport` entity id + the `sequenceNumber` (0-based index of this transport in the trip's transport list).

```
Example: trip 32 has transports [Plane, Bus]
  Plane = transportId 1, sequenceNumber 0
  Bus   = transportId 4, sequenceNumber 1

POST /trips/32/media/transports/1/0/photo
Body: multipart, field "file" = <image>
Response: { fileUrl, publicUrl }

DELETE /trips/32/media/transports/1/0/photo   (no body needed)
```

> The `sequenceNumber` comes from the index of the transport in the `transports[]` array returned by `GET /trips/:id`.

### 5. Delete a photo from a trip

```
DELETE /trips/32/media/photos?path=trip-photos/abc123.jpg
```

The `path` query parameter must be the `fileUrl` value returned by the upload (or the value from the `photos[]` array in the trip response).

---

## All Endpoints Reference

### Trip media
```
POST   /trips/{tripId}/media/photos
DELETE /trips/{tripId}/media/photos?path={fileUrl}

POST   /trips/{tripId}/media/videos
DELETE /trips/{tripId}/media/videos?path={fileUrl}
```

### Accommodation photos
```
POST   /trips/{tripId}/media/accommodations/{accommodationId}/photos
DELETE /trips/{tripId}/media/accommodations/{accommodationId}/photos?path={fileUrl}
```

### Food photo
```
POST   /trips/{tripId}/media/foods/{foodId}/photo
DELETE /trips/{tripId}/media/foods/{foodId}/photo
```

### Transport photo
```
POST   /trips/{tripId}/media/transports/{transportId}/{sequenceNumber}/photo
DELETE /trips/{tripId}/media/transports/{transportId}/{sequenceNumber}/photo
```

### Reference point photos
```
POST   /trips/{tripId}/media/reference-points/{refPointId}/photos
DELETE /trips/{tripId}/media/reference-points/{refPointId}/photos?path={fileUrl}
```

---

## Upload Response Shape

Every upload returns:

```json
{
  "message": "Trip photo uploaded successfully",
  "fileUrl": "trip-photos/abc123-uuid.jpg",
  "publicUrl": "http://localhost:8080/files/trip-photos/abc123-uuid.jpg",
  "fileSize": 204800,
  "contentType": "image/jpeg"
}
```

Delete responses only return `message`.

---

## Error Responses

| HTTP | Meaning |
|---|---|
| `400` | File too large, wrong format, or entity already has max photos |
| `403` | You don't own this trip |
| `404` | Trip, accommodation, food, etc. not found — or photo path not found in entity |

---

## JavaScript / TypeScript Examples

### Upload a photo

```ts
async function uploadTripPhoto(tripId: number, file: File, token: string) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`/trips/${tripId}/media/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    // Do NOT set Content-Type — the browser sets it automatically with the boundary
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }

  const data = await res.json();
  // data.fileUrl  → store this, you'll need it to delete
  // data.publicUrl → use directly as <img src>
  return data;
}
```

### Delete a photo

```ts
async function deleteTripPhoto(tripId: number, fileUrl: string, token: string) {
  const res = await fetch(
    `/trips/${tripId}/media/photos?path=${encodeURIComponent(fileUrl)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
}
```

### Display photos from a trip

```ts
const BASE_FILES_URL = "http://localhost:8080/files"; // use env var in production

const trip = await fetchTrip(tripId); // GET /trips/:id

// trip.photos = ["trip-photos/abc.jpg", "trip-photos/def.jpg"]
const photoUrls = trip.photos.map(p => `${BASE_FILES_URL}/${p}`);
```

```tsx
// React
{trip.photos.map((fileUrl) => (
  <img
    key={fileUrl}
    src={`${BASE_FILES_URL}/${fileUrl}`}
    alt="Trip photo"
  />
))}
```

---

## State Management Tip

Never store only `publicUrl` — you need `fileUrl` to call the delete endpoint. Always store both:

```ts
interface UploadedMedia {
  fileUrl: string;    // used for DELETE
  publicUrl: string;  // used for <img src> or <video src>
}
```

When a trip is loaded from the server, `photos[]` and `videos[]` contain `fileUrl` values only. Construct the full URL at display time by prepending `BASE_FILES_URL`, and pass the raw `fileUrl` back to the delete endpoint.
