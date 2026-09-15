import AVFoundation
import Foundation

// vconv2 <in.mov> <out.mp4> [widthPx] [kbps] — H.264 at a real bitrate, video only.
let a = CommandLine.arguments
guard a.count >= 3 else { FileHandle.standardError.write("usage: vconv2 <in> <out.mp4> [width=540] [kbps=1400]\n".data(using: .utf8)!); exit(1) }
let src = URL(fileURLWithPath: a[1]), dst = URL(fileURLWithPath: a[2])
let targetW = a.count > 3 ? Double(a[3])! : 540
let kbps = a.count > 4 ? Int(a[4])! : 1400
let trimStart = a.count > 5 ? Double(a[5])! : 0
let trimDur = a.count > 6 ? Double(a[6])! : -1
try? FileManager.default.removeItem(at: dst)

let asset = AVURLAsset(url: src)
guard let vTrack = asset.tracks(withMediaType: .video).first else { exit(2) }
let reader = try AVAssetReader(asset: asset)

let vc = AVMutableVideoComposition(propertiesOf: asset)
let scale = targetW / vc.renderSize.width
let outW = (targetW / 2).rounded() * 2
let outH = ((vc.renderSize.height * scale) / 2).rounded() * 2
if let inst = vc.instructions.first as? AVMutableVideoCompositionInstruction,
   let layer = inst.layerInstructions.first as? AVMutableVideoCompositionLayerInstruction {
  var start = CMTime.zero
  var existing = CGAffineTransform.identity
  _ = layer.getTransformRamp(for: .zero, start: &existing, end: nil, timeRange: nil)
  if existing == .identity { existing = vTrack.preferredTransform }
  layer.setTransform(existing.concatenating(CGAffineTransform(scaleX: scale, y: scale)), at: start)
}
vc.renderSize = CGSize(width: outW, height: outH)

let out = AVAssetReaderVideoCompositionOutput(videoTracks: [vTrack],
  videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
out.videoComposition = vc
reader.add(out)
if trimDur > 0 {
  reader.timeRange = CMTimeRange(start: CMTime(seconds: trimStart, preferredTimescale: 600),
                                 duration: CMTime(seconds: trimDur, preferredTimescale: 600))
}

let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: outW,
  AVVideoHeightKey: outH,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: kbps * 1000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoExpectedSourceFrameRateKey: 30,
  ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
writer.add(input)

writer.startWriting()
reader.startReading()
writer.startSession(atSourceTime: CMTime(seconds: trimStart, preferredTimescale: 600))
let sem = DispatchSemaphore(value: 0)
let q = DispatchQueue(label: "enc")
input.requestMediaDataWhenReady(on: q) {
  while input.isReadyForMoreMediaData {
    if let sb = out.copyNextSampleBuffer() {
      input.append(sb)
    } else {
      input.markAsFinished()
      writer.finishWriting { sem.signal() }
      break
    }
  }
}
sem.wait()
if writer.status != .completed || reader.status == .failed {
  FileHandle.standardError.write("fail: \(writer.error.map{"\($0)"} ?? reader.error.map{"\($0)"} ?? "?")\n".data(using: .utf8)!)
  exit(4)
}
print("ok \(dst.lastPathComponent)")
