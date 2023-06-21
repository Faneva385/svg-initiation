function stringToDom(str) {
  //create an DOM node via string
  return document.createRange().createContextualFragment(str).firstChild;
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toSVGPath() {
    return `${this.x} ${this.y}`;
  }

  static fromAngle(angle) {
    return new Point(Math.cos(angle), Math.sin(angle));
  }
}

/**
 * @property {number[]} data
 * @property {SVGPathElement[]} path
 */
class PieChart extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const colors = [
      "#FAAA32",
      "#3EFA7D",
      "#FA6A25",
      "#0C94FA",
      "#FA1F19",
      "#0CFAE2",
      "#AB6D23",
    ];

    this.data = this.getAttribute("data")
      .split(";")
      .map((value) => parseFloat(value));

    const svg = stringToDom(`<svg viewBox="-1 -1 2 2"></svg>`);

    // lets create the paths(chemin svg)
    //here , we ignore the data and we focus in the index (_, k)
    this.paths = this.data.map((_, k) => {
      const color = colors[k % (colors.length - 1)];
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      ); //create an element svg (it indicates that it will be a pure svg element)
      path.setAttribute("fill", color);
      svg.appendChild(path);
      return path;
    });
    shadow.appendChild(svg);
  }

  connectedCallback() {
    this.draw();
  }

  draw() {
    const total = this.data.reduce((acc, v) => acc + v, 0);
    let angle = 0;
    let start = new Point(1, 0);
    for (let k = 0; k < this.data.length; k++) {
      const ratio = this.data[k] / total;
      angle += ratio * 2 * Math.PI;
      const end = Point.fromAngle(angle);
      const largeFlag = ratio > 0.5 ? "1" : "0";
      this.paths[k].setAttribute(
        "d",
        `M 0 0 L ${start.toSVGPath()} A 1 1 0 ${largeFlag} 1 ${end.toSVGPath()} L 0 0` //the last line is for optional here
      );
      start = end;
    }
  }
}

customElements.define("pie-chart", PieChart);
