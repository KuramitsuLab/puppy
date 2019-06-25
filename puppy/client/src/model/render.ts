export const myRender = (render) => {
  const _getTexture = function (render, imagePath) {
    let image = render.textures[imagePath];

    if (image) {
      return image;
    }

    image = render.textures[imagePath] = new Image();
    image.src = imagePath;

    return image;
  };

  render['bodies'] = function (render, bodies, context) {
    const c = context;
    const engine = render.engine;
    const options = render.options;
    const showInternalEdges = options.showInternalEdges || !options.wireframes;

    let body;
    let part;
    let i;
    let k;

    for (i = 0; i < bodies.length; i += 1) {
      body = bodies[i];

      if (!body.render.visible) {
        continue;
      }

      // handle compound parts
      for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k += 1) {
        part = body.parts[k];
        const renderOption = part.render;
        Object.keys(renderOption).forEach((key) => {
          if (!(key in part)) {
            part[key] = renderOption[key];
          }
        });
        if ('image' in part) {
          part['sprite']['texture'] = `./image/${part['image']}`;
        }

        if (!part.visible) {
          continue;
        }

        if (options.showSleeping && body.isSleeping) {
          c.globalAlpha = 0.5 * part.opacity;
        } else if (part.opacity !== 1) {
          c.globalAlpha = part.opacity;
        }

        if (part.sprite && part.sprite.texture && !options.wireframes) {
          // part sprite
          const sprite = part.sprite;
          const texture = _getTexture(render, sprite.texture);

          c.translate(part.position.x, part.position.y);
          c.rotate(part.angle);

          c.drawImage(
            texture,
            texture.width * -sprite.xOffset * sprite.xScale,
            texture.height * -sprite.yOffset * sprite.yScale,
            texture.width * sprite.xScale,
            texture.height * sprite.yScale,
          );

          // revert translation, hopefully faster than save / restore
          c.rotate(-part.angle);
          c.translate(-part.position.x, -part.position.y);
        } else {
          // part polygon
          if (part.circleRadius) {
            c.beginPath();
            c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
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
                c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
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

        c.globalAlpha = 1;

        if (part.value) {
          c.font = part.font || '32px Arial';
          if (part.name === 'コメント') {
            c.fillStyle = 'black';
          } else {
            c.fillStyle = part.fontStyle || 'red';
          }
          c.textAlign = 'center';
          c.fillText(`${part.value}`, part.position.x, part.position.y + 10);
        }
      }
    }
  };

  return render;
};
