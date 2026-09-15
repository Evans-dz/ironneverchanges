import Vision
import CoreImage
import Foundation

// cutout <in.png> <out.png> — foreground instance mask → transparent PNG
let args = CommandLine.arguments
guard args.count >= 3 else { FileHandle.standardError.write("usage: cutout <in> <out>\n".data(using: .utf8)!); exit(1) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

guard let ciImage = CIImage(contentsOf: inURL) else { FileHandle.standardError.write("cannot read input\n".data(using: .utf8)!); exit(2) }
let handler = VNImageRequestHandler(ciImage: ciImage)
let request = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([request]) } catch {
  FileHandle.standardError.write("vision failed: \(error)\n".data(using: .utf8)!); exit(3)
}
guard let result = request.results?.first, !result.allInstances.isEmpty else {
  FileHandle.standardError.write("no foreground found\n".data(using: .utf8)!); exit(4)
}
let maskPB: CVPixelBuffer
do { maskPB = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler) } catch {
  FileHandle.standardError.write("mask failed: \(error)\n".data(using: .utf8)!); exit(5)
}
let maskCI = CIImage(cvPixelBuffer: maskPB)
let blend = CIFilter(name: "CIBlendWithMask")!
blend.setValue(ciImage, forKey: kCIInputImageKey)
blend.setValue(CIImage(color: CIColor.clear).cropped(to: ciImage.extent), forKey: kCIInputBackgroundImageKey)
blend.setValue(maskCI, forKey: kCIInputMaskImageKey)
guard let out = blend.outputImage else { exit(6) }
let ctx = CIContext()
let cs = ciImage.colorSpace ?? CGColorSpace(name: CGColorSpace.sRGB)!
do { try ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: cs) } catch {
  FileHandle.standardError.write("write failed: \(error)\n".data(using: .utf8)!); exit(7)
}
print("ok \(outURL.lastPathComponent)")
