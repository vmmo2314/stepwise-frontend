import React from "react";

const Footer = () => {
  const dat = new Date();
  return (
    <div className="footer">
      <div className="copyright">
        <p>
          Copyright © Diseñado y &amp; desarrollado por{" "}
          <a href="http://google.com/" target="_blank"  rel="noreferrer">
            stepwise
          </a>{" "}
          {dat.getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Footer;
