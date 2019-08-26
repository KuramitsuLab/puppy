// 使えそうな効果
// punkな吹き出し

// https://ja.stackoverflow.com/questions/4445/matter-jsという物理エンジンライブラリのオブジェクトの結合について

export const myRender = render => {
  const _getTexture = (render, imagePath: string) => {
    let image = render.textures[imagePath];
    if (image) {
      return image;
    }
    image = render.textures[imagePath] = new Image();
    if (
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('data:') ||
      imagePath.startsWith('/')
    ) {
      image.src = imagePath;
    } else {
      image.src = `/image/${imagePath}`;
    }
    return image;
  };

  render['bodies'] = function(render, bodies, context) {
    const c = context;
    const options = render.options;
    // const wireframes = options.wireframes;
    const showInternalEdges = options.showInternalEdges || !options.wireframes;
    const defaultFont = options.font || "bold 60px 'Arial'";
    const defaultFontColor = options.fontColor || 'gray';

    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      if (!body.visible) {
        continue;
      }
      // handle compound parts
      for (
        let k = body.parts.length > 1 ? 1 : 0;
        k < body.parts.length;
        k += 1
      ) {
        const part = body.parts[k];
        if (!part.visible) {
          continue;
        }
        if (part.opacity !== 1) {
          c.globalAlpha = part.opacity;
        }

        if (part.image) {
          const texture = _getTexture(render, part.image);
          c.translate(part.position.x, part.position.y);
          c.rotate(part.angle);
          c.drawImage(
            texture,
            part.width * -0.5,
            part.height * -0.5,
            part.width,
            part.height
          );
          c.rotate(-part.angle);
          c.translate(-part.position.x, -part.position.y);
        } else {
          // part polygon
          if (part.circleRadius) {
            c.beginPath();
            c.arc(
              part.position.x,
              part.position.y,
              part.circleRadius,
              0,
              2 * Math.PI
            );
          } else {
            c.beginPath();
            c.moveTo(part.vertices[0].x, part.vertices[0].y);
            for (let j = 1; j < part.vertices.length; j += 1) {
              if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                c.lineTo(part.vertices[j].x, part.vertices[j].y);
              } else {
                c.moveTo(part.vertices[j].x, part.vertices[j].y);
              }
              if (part.vertices[j].isInternal && !showInternalEdges) {
                c.moveTo(
                  part.vertices[(j + 1) % part.vertices.length].x,
                  part.vertices[(j + 1) % part.vertices.length].y
                );
              }
            }
            c.lineTo(part.vertices[0].x, part.vertices[0].y);
            c.closePath();
          }
          if (!options.wireframes) {
            c.fillStyle = part.fillStyle;
            if (part.lineWidth) {
              c.lineWidth = part.lineWidth;
              c.strokeStyle = part.strokeStyle;
              c.stroke();
            }
            c.fill();
          } else {
            c.lineWidth = 1;
            c.strokeStyle = '#bbb';
            c.stroke();
          }
        }

        if (part.value !== undefined) {
          // Make to show null and 0.
          if (part.ref) {
            part.value = part.ref();
          }
          c.save();
          c.font = part.font || defaultFont;
          c.fillStyle = part.fontColor || defaultFontColor;
          c.textAlign = part.textAlign || 'center';
          if (part.shadowColor) {
            c.shadowColor = part.shadowColor; // 赤色の影を付ける
            c.shadowBlur = c.shadowBlur || 0; // ぼかしを０にする
            c.shadowOffsetX = c.shadowOffsetX || 2; // 横に3pxずらす
            c.shadowOffsetY = c.shadowOffsetY || 2; // 縦に1pxずらす
          }
          c.fillText(`${part.value}`, part.position.x, part.position.y + 10);
          c.restore();
        }
        c.globalAlpha = 1;
      }
    }
  };
  return render;
};
