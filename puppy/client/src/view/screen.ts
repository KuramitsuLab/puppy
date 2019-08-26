export const getFullscreen = () => {
  if (document['webkitFullscreenElement']) {
    return document['webkitFullscreenElement'];
  }
  if (document['mozFullScreenElement']) {
    return document['mozFullScreenElement'];
  }
  if (document['msFullscreenElement']) {
    return document['msFullscreenElement'];
  }
  return document['fullscreenElement'];
};

export const exitFullscreen = () => {
  if (document['webkitCancelFullScreen']) {
    document['webkitCancelFullScreen'](); // Chrome15+, Safari5.1+, Opera15+
  } else if (document['mozCancelFullScreen']) {
    document['mozCancelFullScreen'](); // FF10+
  } else if (document['msExitFullscreen']) {
    document['msExitFullscreen'](); // IE11+
  } else if (document['cancelFullScreen']) {
    document['cancelFullScreen'](); // Gecko:FullScreenAPI仕様
  } else if (document.exitFullscreen) {
    document.exitFullscreen(); // HTML5 Fullscreen API仕様
  }
};
