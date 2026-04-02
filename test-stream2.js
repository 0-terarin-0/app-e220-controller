async function run() {
  const rs = new ReadableStream({
    start(c) {
      c.enqueue(1);
    }
  });
  const reader = rs.getReader();
  await reader.cancel();
  try {
    rs.getReader();
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
