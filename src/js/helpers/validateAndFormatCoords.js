const validateCoords = (coords) => {
  if (!coords) return;

  const regex =
    /^(\+|\-)?\d{0,3}((\.|\,)\d{0,7})?\s+(\+|\-)?\d{0,3}((\.|\,)\d{0,7})?$/;
  const isValidCoords = regex.test(coords);

  return isValidCoords;
};

const formatCoords = (coords) => {
  if (!coords) return;

  const arrayCoords = coords.split(/\s+/);
  const formatedCoords = arrayCoords.map((item) => {
    const clearedCoord = item.replace(/(\+)|(\,)/g, (match, plus, comma) => {
      if (plus) {
        return ``;
      }
      if (comma) {
        return `.`;
      }
    });

    const arrayClearedCoord = clearedCoord.split(`.`);

    const regex = /\d/;
    if (!regex.test(arrayClearedCoord[0])) {
      arrayClearedCoord[0] += `0`;
    }

    if (!arrayClearedCoord[1]) {
      return `${arrayClearedCoord[0]}.0000000`;
    }

    let newCoordsDegrees = arrayClearedCoord[1];
    if (arrayClearedCoord[1].length >= 7) {
      return clearedCoord;
    }

    for (let i = arrayClearedCoord[1].length; i < 7; i += 1) {
      newCoordsDegrees += `0`;
    }

    return `${arrayClearedCoord[0]}.${newCoordsDegrees}`;
  });

  return formatedCoords;
};

export { validateCoords, formatCoords };
