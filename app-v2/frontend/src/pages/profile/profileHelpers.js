const supportedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
export const profileSkills = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Could not prepare the profile photo."));
  reader.readAsDataURL(blob);
});

export const prepareProfilePhoto = (file) => new Promise((resolve, reject) => {
  if (!supportedPhotoTypes.includes(file.type)) {
    reject(new Error("Please choose a JPG, PNG or WEBP image."));
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    reject(new Error("Please choose an image smaller than 8 MB."));
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = async () => {
    URL.revokeObjectURL(objectUrl);
    const maxDimension = 720;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Your browser could not prepare the profile photo."));
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const createBlob = (quality) => new Promise((resolveBlob, rejectBlob) => {
      canvas.toBlob((blob) => blob ? resolveBlob(blob) : rejectBlob(new Error("Could not prepare the profile photo.")), "image/jpeg", quality);
    });

    try {
      let blob = await createBlob(0.82);
      if (blob.size > 450 * 1024) blob = await createBlob(0.62);
      if (blob.size > 450 * 1024) throw new Error("This image is still too large after optimization. Please choose a smaller image.");
      resolve(await blobToDataUrl(blob));
    } catch (error) {
      reject(error);
    }
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("That image could not be read. Please choose another file."));
  };
  image.src = objectUrl;
});
