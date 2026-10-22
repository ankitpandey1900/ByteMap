# ADR 003: 80ms Throttled IPC Streaming & Backpressure Management

## Status
Accepted

## The Problem
In desktop webview architectures (Tauri v2, Electron), the native backend and the frontend communicate over an Inter-Process Communication (IPC) bridge. 

When scanning a drive with 500,000 files, the Rust filesystem crawler traverses thousands of entries per second. If the backend emits an IPC event for every single file visited:
1. **Message Queue Choke**: The webview's internal message bus is flooded with hundreds of thousands of serialized JSON messages.
2. **UI Lockup**: React's state reconciliation engine cannot process state updates that quickly. Frame rates plummet from 60 FPS down to 2 FPS, and the application appears to freeze or crash.
3. **Memory Spikes**: Unprocessed IPC messages buffer up in RAM, creating unnecessary memory overhead.

## The Decision
I implemented an **80ms timer-based throttling gate** inside the Rust scanner worker loop:

- As the crawler visits files, it continuously updates an in-memory atomic statistics struct (files scanned, bytes read, current path).
- Before dispatching an IPC event, the worker checks:
  ```rust
  if last_progress_report.elapsed() >= Duration::from_millis(80) {
      let _ = app.emit("scan_progress", &progress);
      last_progress_report = Instant::now();
  }
  ```
- This caps progress events to approximately **12 updates per second**, perfectly tuned for human visual perception while keeping the IPC channel completely unburdened.

## Trade-offs
- **Cons**: The frontend doesn't see every individual sub-millisecond file path tick.
- **Pros**: The UI stays silky smooth at 60 FPS, memory usage remains flat, and cancellation signals can be processed by the worker thread within milliseconds without getting stuck behind a giant queue.
