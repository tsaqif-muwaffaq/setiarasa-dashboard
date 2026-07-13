export const FloatingShapes = () => {
  return (
    <div className="floating-shapes" aria-hidden="true">
      {/* Square - Rotating */}
      <div className="shape shape-square" style={{ top: '5%', left: '3%' }} />
      <div className="shape shape-square-2" style={{ bottom: '8%', right: '2%' }} />
      
      {/* Circle - Pulse */}
      <div className="shape shape-circle" style={{ width: '150px', height: '150px', top: '15%', right: '8%' }} />
      <div className="shape shape-circle-2" style={{ width: '100px', height: '100px', bottom: '20%', left: '5%' }} />
      
      {/* Triangle - Float */}
      <div className="shape shape-triangle" style={{ top: '40%', left: '1%', animationDelay: '-1s' }} />
      <div className="shape shape-triangle-2" style={{ top: '60%', right: '1%', animationDelay: '-2s' }} />
      
      {/* Diamond - Spin */}
      <div className="shape shape-diamond" style={{ top: '25%', left: '50%', transform: 'rotate(45deg)' }} />
      <div className="shape shape-diamond-2" style={{ bottom: '35%', right: '10%', transform: 'rotate(45deg)' }} />
      
      {/* Cross - Float */}
      <div className="shape shape-cross hidden-mobile" style={{ top: '75%', left: '8%' }} />
      
      {/* Hexagon - Spin */}
      <div className="shape shape-hexagon hidden-mobile" style={{ top: '10%', left: '25%' }} />
    </div>
  );
};