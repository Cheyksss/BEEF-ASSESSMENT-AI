import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ImageUploadWidget } from "./ImageUploadWidget"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ImageUploadWidget", () => {
  it("accepts a dropped image file", () => {
    const onImageSelected = vi.fn()
    const file = new File(["beef image"], "beef.jpg", { type: "image/jpeg" })
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:beef-image"),
      revokeObjectURL: vi.fn(),
    })

    render(<ImageUploadWidget onImageSelected={onImageSelected} />)

    const dropZone = screen.getByText("Click to upload or drag & drop beef cut image").closest("label")
    expect(dropZone).not.toBeNull()
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file], types: ["Files"], dropEffect: "none" },
    })

    expect(onImageSelected).toHaveBeenCalledWith(file)
    expect(screen.getByAltText("Selected beef cut preview")).toBeInTheDocument()
  })
})
