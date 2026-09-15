import AVFoundation
import CoreImage
import Foundation

// framegrab <in.mov> <outdir> [stepSeconds=1] — dump frames as small PNGs
let a = CommandLine.arguments
guard a.count >= 3 else { exit(1) }
let src = URL(fileURLWithPath: a[1])
let outDir = URL(fileURLWithPath: a[2])
let step = a.count > 3 ? Double(a[3])! : 1.0
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let asset = AVURLAsset(url: src)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.maximumSize = CGSize(width: 180, height: 320)
gen.requestedTimeToleranceBefore = .init(seconds: 0.2, preferredTimescale: 600)
gen.requestedTimeToleranceAfter = .init(seconds: 0.2, preferredTimescale: 600)
let dur = asset.duration.seconds
let ctx = CIContext()
var t = 0.0
var i = 0
while t < dur {
  if let cg = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) {
    let ci = CIImage(cgImage: cg)
    let name = String(format: "f%03d_t%04.1f.png", i, t)
    try? ctx.writePNGRepresentation(of: ci, to: outDir.appendingPathComponent(name), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  }
  t += step; i += 1
}
print("frames \(i) dur \(String(format: "%.1f", dur))")
