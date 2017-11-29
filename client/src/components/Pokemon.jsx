import React from 'react';
import css from '../styles.css';

const Pokemon = (props) => {
  const classes = () => {
    if (props.attacking) {
      return css.attackAnimation;
    } else {
      return css.staticAnimation;
    }
  };

  return (
    <div>
      <img className={classes()} src={props.sprite} style={{ minWidth: '200px' }} alt="pikachu" />
    </div>
  );
};

export default Pokemon;
