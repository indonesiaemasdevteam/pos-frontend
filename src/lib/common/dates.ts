const getDateTime = (value: any) => {
  const checkTime = (i: any) => {
    if (i < 10) {
      i = "0" + i;
    } // add zero in front of numbers < 10
    return i;
  };
  let date = new Date(value);
  let tgl = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  let month = date.getMonth();
  let bln = month + 1 < 10 ? "0" + (month + 1) : month + 1;
  let year = date.getFullYear() + "-" + bln + "-" + tgl;
  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  let time = `${h}:${m}:${s}`;
  return `${year}T${time}`;
};

export { getDateTime };
