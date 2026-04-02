async function run() {
  const rs = new ReadableStream({
    start(c) {
      c.enqueue(1);
    }
  });
  const reader = rs.getReader();
  reader.releaseLock();
  try {
    rs.getReader();
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
