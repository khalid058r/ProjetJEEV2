const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dgasa9ogy'
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'khalid123'

export async function uploadToCloudinary(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', 'products')

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        )

        if (!response.ok) {
            throw new Error('Upload failed')
        }

        const data = await response.json()
        return data.secure_url
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        throw error
    }
}

export function getCloudinaryUrl(publicId, options = {}) {
    const { width, height, crop = 'fill', quality = 'auto' } = options

    let transforms = `q_${quality}`
    if (width) transforms += `,w_${width}`
    if (height) transforms += `,h_${height}`
    if (crop) transforms += `,c_${crop}`

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}

export function getOptimizedImageUrl(url, width = 400) {
    if (!url) return null

    // If already a Cloudinary URL, add transformations
    if (url.includes('cloudinary.com')) {
        const parts = url.split('/upload/')
        if (parts.length === 2) {
            return `${parts[0]}/upload/w_${width},q_auto,f_auto/${parts[1]}`
        }
    }

    return url
}

export default {
    uploadToCloudinary,
    getCloudinaryUrl,
    getOptimizedImageUrl,
}
