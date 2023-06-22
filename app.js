function stringToDom(str) {
  //create an DOM node via string
  return document.createRange().createContextualFragment(str).firstChild;
}

function easyOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
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
    const labels = this.getAttribute("labels")?.split(";") ?? [];

    const donut = this.getAttribute("donut") ?? "0";
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

    //in the comment bellow , we select the node by the class attribute
    /**
      * const svg = stringToDom(`<svg viewBox="-1 -1 2 2">
      * <g class="pathGroup" mask="url(#graphMask)">
      * </g>
      * <mask class="maskGroup" id="graphMask">
      * <rect x="-1" y="-1" width="2" height="2" fill="white"/>
      * <circle r="0.2" fill="black"/>
      * </mask>
      * </svg>`);

      * const pathGroup = svg.querySelector(".pathGroup");
      * const maskGroup = svg.querySelector(".maskGroup");
      */

    const svg = stringToDom(`<svg viewBox="-1 -1 2 2">
    <g  mask="url(#graphMask)">
    </g>
    <mask  id="graphMask">
    <rect x="-1" y="-1" width="2" height="2" fill="white"/>
    <circle r="${donut}" fill="black"/>
    </mask>
    </svg>`);

    const pathGroup = svg.querySelector("g");
    const maskGroup = svg.querySelector("mask");
    const gap = this.getAttribute("gap") ?? 0.015; //it takes the attribute gap provided in the <pie-chart></pie-chart>

    // lets create the paths(chemin svg)
    //here , we ignore the data and we focus in the index k (_, k)
    this.paths = this.data.map((_, k) => {
      const color = colors[k % (colors.length - 1)];
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      ); //create an element svg (it indicates that it will be a pure svg element)
      path.setAttribute("fill", color);
      path.addEventListener("mouseover", () => this.handlePathHover(k));
      path.addEventListener("mouseout", () => this.handlePathOut(k));
      pathGroup.appendChild(path);
      return path;
    });

    this.lines = this.data.map((_, k) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      ); //create an element svg (it indicates that it will be a pure svg element)
      line.setAttribute("stroke", "#000");
      line.setAttribute("stroke-width", gap);
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      maskGroup.appendChild(line);
      return line;
    });

    this.labels = labels.map((label) => {
      const div = document.createElement("div");
      div.innerText = label;
      shadow.appendChild(div);
      return div;
    });

    const style = document.createElement("style");
    style.innerHTML = `
        :host {
          display: block ;
          position: relative;
        }
        svg {
            weidth : 100%;
            height : 100%;
        }
        path {
          cursor:pointer;
          transition : opacity .3s
        }
        path:hover {
          opacity: 0.5;
        }
        div {
          position: absolute;
          top: 0;
          left: 0; 
          font-size: 0.8rem;
          padding: .1em .2em;
          transform: translate(-50%, -50%);
          background-color= var(--tooltip-bg, #FFF); 
          opacity: 0;
          transition: opacity .3s;
        }
        .is-active{
          opacity: 1;
        }
    `;

    shadow.appendChild(style);
    shadow.appendChild(svg);
  }

  connectedCallback() {
    const now = Date.now();
    const duration = 1000;
    const draw = () => {
      const t = (Date.now() - now) / duration;
      if (t < 1) {
        this.draw(easyOutExpo(t));
        window.requestAnimationFrame(draw);
      } else {
        this.draw();
      }
    };
    window.requestAnimationFrame(draw);
  }

  draw(progress = 1) {
    //the progress params indicates the progression of the animation
    const total = this.data.reduce((acc, v) => acc + v, 0);
    let angle = Math.PI / -2;
    let start = new Point(0, -1);
    for (let k = 0; k < this.data.length; k++) {
      this.lines[k].setAttribute("x2", start.x);
      this.lines[k].setAttribute("y2", start.y);
      const ratio = (this.data[k] / total) * progress;
      if (progress === 1) {
        this.postionLabel(this.labels[k], angle + ratio * Math.PI);
      }
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

  /**
   *  target effect when hover added
   * @params {number} k index of the hovered element
   * */
  handlePathHover(k) {
    this.dispatchEvent(new CustomEvent("sectionhover", { detail: k }));
    this.labels[k]?.classList.add("is-active");
  }

  /**
   *  target effect when hover removed
   * @params {number} k index of the hovered element
   * */
  handlePathOut(k) {
    this.labels[k]?.classList.remove("is-active");
  }

  postionLabel(label, angle) {
    if (!label || !angle) {
      return;
    }
    const point = Point.fromAngle(angle);
    label.style.setProperty("top", `${(point.y * 0.5 + 0.5) * 100}%`);
    label.style.setProperty("left", `${(point.x * 0.5 + 0.5) * 100}%`);
  }
}

customElements.define("pie-chart", PieChart);
