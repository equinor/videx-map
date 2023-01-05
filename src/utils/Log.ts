function GetDate() {
  const date: Date = new Date();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  const ms = date.getMilliseconds();
  return `${hour}:${min}:${sec}.${ms}`;
}

export default function log(text: string) {
  const out = `%cVIDEX-MAP%c ${text}`;

  const style = `
    background: #555;
    color: #eee;
    padding: 0 6px 0 6px;
    border-radius: 2px;
  `;

  console.log(
    `${out} (${GetDate()})`,
    style,
    null,
  );
}
