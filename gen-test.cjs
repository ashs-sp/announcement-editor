const fs = require('fs');
let points = [];
for(let i=0; i<3; i++){
  let start = i * 297;
  let fStart = start + 280; // 17mm footer
  let end = start + 297;
  if(i>0) points.push(`0 ${start}mm`);
  points.push(`0 ${fStart}mm`);
  points.push(`100% ${fStart}mm`);
  points.push(`100% ${end}mm`);
  points.push(`0 ${end}mm`);
}
const poly = `polygon(0 0, ${points.join(', ')})`;
const html = `
<html><head><style>
.container { width: 210mm; border: 1px solid red; font-size: 20px; line-height: 1.5; }
.spacer { float: left; width: 100%; height: 891mm; shape-outside: ${poly}; margin:0; padding:0; }
</style></head><body>
<div class="container">
  <div class="spacer"></div>
  <p>${'word '.repeat(2000)}</p>
</div>
</body></html>`;
fs.writeFileSync('D:/chiwei/gemini-cli/announcement-editor/test-shape.html', html);
