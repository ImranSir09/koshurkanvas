package com.kashurkanvas.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "KashurMediaExport")
public class KashurMediaExportPlugin extends Plugin {
    private static final String TAG = "KashurMediaExport";
    private static final String ALBUM_NAME = "KoshurKanvas";

    private byte[] pendingSafBytes = null;

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-design.png");
        String mimeType = call.getString("mimeType", "image/png");
        String album = call.getString("album", ALBUM_NAME);

        if (data == null || data.trim().isEmpty()) {
            call.reject("Data is required and cannot be empty");
            return;
        }

        try {
            byte[] bytes = decodeData(data);
            if (bytes == null || bytes.length == 0) {
                call.reject("Decoded file bytes are empty (0 bytes)");
                return;
            }

            Uri savedUri = null;
            if ("image/svg+xml".equalsIgnoreCase(mimeType) || fileName.endsWith(".svg")) {
                savedUri = saveImageBytes(getContext(), bytes, fileName, mimeType, album);
                if (savedUri == null) {
                    savedUri = saveDocumentBytes(getContext(), bytes, fileName, mimeType, album);
                }
            } else {
                savedUri = saveImageBytes(getContext(), bytes, fileName, mimeType, album);
            }

            if (savedUri != null) {
                showToast("Saved to Pictures/" + album);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", savedUri.toString());
                ret.put("fileName", fileName);
                ret.put("path", "Pictures/" + album + "/" + fileName);
                call.resolve(ret);
            } else {
                call.reject("Failed to save image to MediaStore");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error saving image", e);
            call.reject("Error saving image: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveDocumentToStorage(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-document.pdf");
        String mimeType = call.getString("mimeType", "application/pdf");
        String folder = call.getString("folder", ALBUM_NAME);

        if (data == null || data.trim().isEmpty()) {
            call.reject("Data is required and cannot be empty");
            return;
        }

        try {
            byte[] bytes = decodeData(data);
            if (bytes == null || bytes.length == 0) {
                call.reject("Decoded document bytes are empty (0 bytes)");
                return;
            }

            Uri savedUri = saveDocumentBytes(getContext(), bytes, fileName, mimeType, folder);

            if (savedUri != null) {
                showToast("Saved to Downloads/" + folder);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", savedUri.toString());
                ret.put("fileName", fileName);
                ret.put("path", "Downloads/" + folder + "/" + fileName);
                call.resolve(ret);
            } else {
                call.reject("Failed to save document to MediaStore Downloads");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error saving document", e);
            call.reject("Error saving document: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveWithSAF(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-export.png");
        String mimeType = call.getString("mimeType", "image/png");

        if (data == null || data.trim().isEmpty()) {
            call.reject("Data is required");
            return;
        }

        byte[] bytes = decodeData(data);
        if (bytes == null || bytes.length == 0) {
            call.reject("Decoded file bytes are empty (0 bytes)");
            return;
        }

        pendingSafBytes = bytes;

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        startActivityForResult(call, intent, "handleSafResult");
    }

    @ActivityCallback
    private void handleSafResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri uri = result.getData().getData();
            if (uri != null && pendingSafBytes != null && pendingSafBytes.length > 0) {
                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os != null) {
                        os.write(pendingSafBytes);
                        os.flush();
                        showToast("Saved to selected location");
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("uri", uri.toString());
                        call.resolve(ret);
                        return;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error writing to SAF URI", e);
                    call.reject("Failed to write to selected file location: " + e.getMessage());
                    return;
                } finally {
                    pendingSafBytes = null;
                }
            }
        }
        pendingSafBytes = null;
        call.reject("Save operation cancelled or failed");
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-export.png");
        String mimeType = call.getString("mimeType", "image/png");
        String title = call.getString("title", "Kashur Kanvas");
        String text = call.getString("text", "Created with Kashur Kanvas");

        if (data == null || data.trim().isEmpty()) {
            call.reject("Data is required and cannot be empty");
            return;
        }

        try {
            byte[] bytes = decodeData(data);
            if (bytes == null || bytes.length == 0) {
                call.reject("Decoded file bytes are empty (0 bytes)");
                return;
            }

            Context context = getContext();
            File cacheDir = new File(context.getCacheDir(), "shared_exports");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }

            File tempFile = new File(cacheDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(bytes);
                fos.flush();
            }

            Uri contentUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    tempFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType(mimeType);
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            if (title != null && !title.isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            }
            if (text != null && !text.isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_TEXT, text);
            }
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("uri", contentUri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error sharing file", e);
            call.reject("Error sharing file: " + e.getMessage(), e);
        }
    }

    // Static helper methods for direct Java / Bridge usage
    public static byte[] decodeData(String data) {
        if (data == null || data.isEmpty()) {
            return new byte[0];
        }

        if (data.startsWith("data:")) {
            int commaIndex = data.indexOf(",");
            if (commaIndex != -1) {
                String meta = data.substring(0, commaIndex);
                String raw = data.substring(commaIndex + 1);
                if (meta.contains(";base64")) {
                    return Base64.decode(raw, Base64.DEFAULT);
                } else {
                    try {
                        return URLDecoder.decode(raw, "UTF-8").getBytes(StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        return raw.getBytes(StandardCharsets.UTF_8);
                    }
                }
            }
        }

        try {
            return Base64.decode(data, Base64.DEFAULT);
        } catch (Exception e) {
            return data.getBytes(StandardCharsets.UTF_8);
        }
    }

    public static String getMimeTypeFromFileName(String fileName) {
        if (fileName == null) return "application/octet-stream";
        String ext = fileName.toLowerCase();
        if (ext.endsWith(".png")) return "image/png";
        if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) return "image/jpeg";
        if (ext.endsWith(".svg")) return "image/svg+xml";
        if (ext.endsWith(".webp")) return "image/webp";
        if (ext.endsWith(".pdf")) return "application/pdf";
        if (ext.endsWith(".doc")) return "application/msword";
        if (ext.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (ext.endsWith(".txt")) return "text/plain;charset=utf-8";
        if (ext.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    public static String parseFileName(String contentDisposition, String url, String mimeType) {
        String fileName = null;
        if (contentDisposition != null) {
            int idx = contentDisposition.toLowerCase().indexOf("filename=");
            if (idx != -1) {
                fileName = contentDisposition.substring(idx + 9).trim();
                if (fileName.startsWith("\"") && fileName.endsWith("\"") && fileName.length() > 1) {
                    fileName = fileName.substring(1, fileName.length() - 1);
                }
                if (fileName.contains(";")) {
                    fileName = fileName.substring(0, fileName.indexOf(";")).trim();
                }
            }
        }
        if (fileName == null || fileName.isEmpty()) {
            if (url != null && !url.startsWith("data:") && !url.startsWith("blob:")) {
                try {
                    String path = Uri.parse(url).getPath();
                    if (path != null && path.contains("/")) {
                        fileName = path.substring(path.lastIndexOf('/') + 1);
                    }
                } catch (Exception ignored) {}
            }
        }
        if (fileName == null || fileName.isEmpty() || !fileName.contains(".")) {
            String ext = ".png";
            if (mimeType != null) {
                if (mimeType.contains("jpeg") || mimeType.contains("jpg")) ext = ".jpg";
                else if (mimeType.contains("svg")) ext = ".svg";
                else if (mimeType.contains("pdf")) ext = ".pdf";
                else if (mimeType.contains("word") || mimeType.contains("msword")) ext = ".doc";
                else if (mimeType.contains("text")) ext = ".txt";
                else if (mimeType.contains("json")) ext = ".json";
            }
            fileName = "kashur-export-" + System.currentTimeMillis() + ext;
        }
        return fileName;
    }

    public static Uri saveImageBytes(Context context, byte[] bytes, String fileName, String mimeType, String album) {
        if (bytes == null || bytes.length == 0) {
            Log.e(TAG, "saveImageBytes called with 0 bytes");
            return null;
        }

        ContentResolver resolver = context.getContentResolver();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + album);
            values.put(MediaStore.Images.Media.IS_PENDING, 1);

            Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (uri != null) {
                try (OutputStream os = resolver.openOutputStream(uri)) {
                    if (os != null) {
                        os.write(bytes);
                        os.flush();
                    }
                    values.clear();
                    values.put(MediaStore.Images.Media.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                    return uri;
                } catch (Exception e) {
                    Log.e(TAG, "Failed writing to MediaStore Images", e);
                    try {
                        resolver.delete(uri, null, null);
                    } catch (Exception ignored) {}
                }
            }
        } else {
            File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
            File albumDir = new File(picturesDir, album);
            if (!albumDir.exists()) {
                albumDir.mkdirs();
            }
            File outFile = new File(albumDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(bytes);
                fos.flush();
                MediaScannerConnection.scanFile(
                        context,
                        new String[]{outFile.getAbsolutePath()},
                        new String[]{mimeType},
                        null
                );
                return Uri.fromFile(outFile);
            } catch (Exception e) {
                Log.e(TAG, "Failed writing to public pictures directory", e);
            }
        }
        return null;
    }

    public static Uri saveDocumentBytes(Context context, byte[] bytes, String fileName, String mimeType, String folder) {
        if (bytes == null || bytes.length == 0) {
            Log.e(TAG, "saveDocumentBytes called with 0 bytes");
            return null;
        }

        ContentResolver resolver = context.getContentResolver();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + File.separator + folder);
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri != null) {
                try (OutputStream os = resolver.openOutputStream(uri)) {
                    if (os != null) {
                        os.write(bytes);
                        os.flush();
                    }
                    values.clear();
                    values.put(MediaStore.Downloads.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                    return uri;
                } catch (Exception e) {
                    Log.e(TAG, "Failed writing document to MediaStore Downloads", e);
                    try {
                        resolver.delete(uri, null, null);
                    } catch (Exception ignored) {}
                }
            }
        } else {
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File folderDir = new File(downloadsDir, folder);
            if (!folderDir.exists()) {
                folderDir.mkdirs();
            }
            File outFile = new File(folderDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(bytes);
                fos.flush();
                MediaScannerConnection.scanFile(
                        context,
                        new String[]{outFile.getAbsolutePath()},
                        new String[]{mimeType},
                        null
                );
                return Uri.fromFile(outFile);
            } catch (Exception e) {
                Log.e(TAG, "Failed writing document to public downloads directory", e);
            }
        }
        return null;
    }

    private void showToast(final String message) {
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                Toast.makeText(getContext(), message, Toast.LENGTH_LONG).show();
            } catch (Exception ignored) {}
        });
    }

    /**
     * Web JavaScript interface exposed to WebView as `window.KashurNativeExport`
     */
    public static class JsInterface {
        private final Context context;

        public JsInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String saveImage(String data, String fileName, String mimeType) {
            try {
                byte[] bytes = decodeData(data);
                if (bytes == null || bytes.length == 0) return "";
                Uri uri = saveImageBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                if (uri == null && ("image/svg+xml".equalsIgnoreCase(mimeType) || fileName.endsWith(".svg"))) {
                    uri = saveDocumentBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                }
                if (uri != null) {
                    new Handler(Looper.getMainLooper()).post(() ->
                            Toast.makeText(context, "Saved to Pictures/" + ALBUM_NAME, Toast.LENGTH_LONG).show()
                    );
                    return uri.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "JsInterface saveImage failed", e);
            }
            return "";
        }

        @JavascriptInterface
        public String saveDocument(String data, String fileName, String mimeType) {
            try {
                byte[] bytes = decodeData(data);
                if (bytes == null || bytes.length == 0) return "";
                Uri uri = saveDocumentBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                if (uri != null) {
                    new Handler(Looper.getMainLooper()).post(() ->
                            Toast.makeText(context, "Saved to Downloads/" + ALBUM_NAME, Toast.LENGTH_LONG).show()
                    );
                    return uri.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "JsInterface saveDocument failed", e);
            }
            return "";
        }

        @JavascriptInterface
        public void handleBlobDownload(String dataUrl, String fileName, String mimeType) {
            if (dataUrl == null || dataUrl.isEmpty()) return;
            try {
                byte[] bytes = decodeData(dataUrl);
                if (bytes == null || bytes.length == 0) return;
                boolean isImage = (mimeType != null && mimeType.startsWith("image/")) ||
                        fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".svg");
                Uri uri = isImage ? saveImageBytes(context, bytes, fileName, mimeType, ALBUM_NAME)
                                  : saveDocumentBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                if (uri == null && isImage && fileName.endsWith(".svg")) {
                    uri = saveDocumentBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                }
                if (uri != null) {
                    String dest = isImage ? "Pictures/" + ALBUM_NAME : "Downloads/" + ALBUM_NAME;
                    new Handler(Looper.getMainLooper()).post(() ->
                            Toast.makeText(context, "Downloaded and saved to " + dest, Toast.LENGTH_LONG).show()
                    );
                }
            } catch (Exception e) {
                Log.e(TAG, "handleBlobDownload error", e);
            }
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }
    }
}

