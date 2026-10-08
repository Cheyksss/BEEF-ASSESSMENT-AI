"""
Image preprocessing module for classifier inference and fat estimation.
Implements ImageNet normalization for 224x224 tensors and 800x800 resizing for computer vision.
"""

from typing import Optional
from PIL import Image
import torch
from torchvision import transforms


class ImagePreprocessor:
    """
    Handles preprocessing of PIL images for CNN classifiers and computer vision analysis.
    """

    def __init__(self):
        # ImageNet normalization standard
        self.mean = [0.485, 0.456, 0.406]
        self.std = [0.229, 0.224, 0.225]

        self.transform_224 = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=self.mean, std=self.std),
        ])

    def preprocess_for_classifier(
        self,
        image: Image.Image,
        device: Optional[torch.device] = None,
    ) -> torch.Tensor:
        """
        Preprocesses a PIL image for ReXNet-150 classifiers:
        1. Ensures RGB mode
        2. Resizes to 224x224
        3. Converts to tensor and normalizes with ImageNet stats
        4. Adds batch dimension (shape: [1, 3, 224, 224])
        5. Moves tensor to the specified device if provided

        Args:
            image: Input PIL Image
            device: Optional torch.device to transfer the tensor to

        Returns:
            torch.Tensor: Preprocessed batch tensor of shape (1, 3, 224, 224)
        """
        if image.mode != "RGB":
            image = image.convert("RGB")

        tensor = self.transform_224(image)
        # Add batch dimension: [3, 224, 224] -> [1, 3, 224, 224]
        tensor = tensor.unsqueeze(0)

        if device is not None:
            tensor = tensor.to(device)

        return tensor

    def resize_for_fat_estimation(
        self,
        image: Image.Image,
        size: tuple = (800, 800),
    ) -> Image.Image:
        """
        Resizes PIL image to 800x800 for computer vision fat ratio estimation.

        Args:
            image: Input PIL Image
            size: Target size tuple (default: (800, 800))

        Returns:
            Image.Image: Resized PIL Image
        """
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image.resize(size, Image.Resampling.BILINEAR)


# Global singleton instance
preprocessor = ImagePreprocessor()
