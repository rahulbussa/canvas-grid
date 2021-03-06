const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [ 2048, 2048 ]
};

const sketch = () => {
  const createGrid = ()=>{
    const points = [];
    const count = 40;

    for(let x=0;x<count;x++){
      for(let y=0;y<count;y++){
        const u = count<=1?0.5:x/(count-1);
        const v = count<=1?0.5:y/(count-1);
        
        points.push([u,v]);
      }
    }

    return points;
  }
  
  //random.setSeed(512);
  const points = createGrid().filter(() => random.value() > 0.6);
  const margin = 300;
  console.log(points);

  return ({ context, width, height }) => {
    context.fillStyle='#283148';
    context.fillRect(0, 0 , width, height);

    points.map(([u,v])=>{
        const x = lerp(margin, width - margin, u);
        const y = lerp(margin, height - margin, v);

        context.beginPath();
        context.arc(x, y, 10, Math.PI*2, false);
        
        context.fillStyle = '#913535';
        context.lineWidth = 10;
        context.fill();
    })
  };
};

canvasSketch(sketch, settings);
