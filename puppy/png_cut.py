from PIL import Image, ImageChops  # pip install pillow
import os
import glob

usrdir = './client/static/image/'
pngfiles = glob.glob(os.path.join(usrdir, '*.png'))

for file in pngfiles:
  img = Image.open(file)
  # img.show()
  name, ext = os.path.splitext(os.path.basename(file))

  bg = Image.new(img.mode, img.size, img.getpixel((0, 0)))  # 左上のピクセルで画像を作る
  diff = ImageChops.difference(img, bg)
  diff = ImageChops.add(diff, diff, 2.0, -100)
  bbox = diff.getbbox()

  cropped = img.crop(bbox)    # 元画像を切り出す
  # cropped.show()
  cropped.save(file)  # 上書き保存
  # print(os.path.join(usrdir, '{}.png'.format(name))) 別名で保存するならここで変える
