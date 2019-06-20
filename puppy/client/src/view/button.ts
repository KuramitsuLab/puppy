export type ButtonID = 'play' | 'pause' | 'reload' | 'debug' | 'extend' | 'font-plus' | 'font-minus';

export const buttonActivate = (id: ButtonID) => {
  document.getElementById(id).setAttribute('stroke', 'black');
};

export const buttonInactivate = (id: ButtonID) => {
  document.getElementById(id).setAttribute('stroke', 'gray');
};

/* Init */

buttonInactivate('pause');
