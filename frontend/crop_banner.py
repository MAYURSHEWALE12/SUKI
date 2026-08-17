from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

if __name__ == '__main__':
    im = Image.open(r'c:\Users\mvshe\Desktop\suki\frontend\public\images\sarees_banner.png')
    im = trim(im)
    im.save(r'c:\Users\mvshe\Desktop\suki\frontend\public\images\sarees_banner.png')
    print("Cropped successfully")
