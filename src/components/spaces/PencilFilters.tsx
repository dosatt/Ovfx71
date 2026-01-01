/**
 * Mischief-inspired SVG pencil texture filters
 * Key feature: Uses OPACITY VARIATIONS to create natural, organic pencil strokes
 * Mischief's signature is alpha-based texture, not color-based
 */
export function PencilFilters() {
  return (
    <defs>
      {/* Main Mischief-style pencil texture - OPACITY BASED */}
      <filter id="pencilTexture" x="-50%" y="-50%" width="200%" height="200%">
        {/* Generate fine grain noise pattern */}
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="2.5 1.8" 
          numOctaves="4" 
          seed="100" 
          result="finegrain"
        />
        
        {/* Convert to grayscale for alpha manipulation */}
        <feColorMatrix 
          in="finegrain" 
          type="saturate" 
          values="0" 
          result="graygrain"
        />
        
        {/* Generate medium grain for layering */}
        <feTurbulence 
          type="turbulence" 
          baseFrequency="1.2 0.8" 
          numOctaves="3" 
          seed="42" 
          result="mediumgrain"
        />
        
        <feColorMatrix 
          in="mediumgrain" 
          type="saturate" 
          values="0" 
          result="graymedium"
        />
        
        {/* Blend noise layers using multiply for organic variation */}
        <feBlend 
          in="graygrain" 
          in2="graymedium" 
          mode="multiply" 
          result="combinedgrain"
        />
        
        {/* Apply the noise pattern to OPACITY only (this is the Mischief key!) */}
        <feComposite 
          in="SourceGraphic" 
          in2="combinedgrain" 
          operator="in" 
          result="opacityModulated"
        />
        
        {/* Soften edges with subtle blur */}
        <feGaussianBlur 
          in="opacityModulated" 
          stdDeviation="0.5" 
          result="softened"
        />
        
        {/* Use feComponentTransfer to fine-tune opacity variations */}
        <feComponentTransfer in="softened" result="adjusted">
          {/* Keep RGB as-is */}
          <feFuncR type="identity"/>
          <feFuncG type="identity"/>
          <feFuncB type="identity"/>
          {/* Modify alpha channel: slope < 1 reduces overall opacity, creates transparency variation */}
          <feFuncA type="linear" slope="0.85" intercept="0.1"/>
        </feComponentTransfer>
        
        {/* Add secondary layer with different opacity for depth */}
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.8 0.5" 
          numOctaves="2" 
          seed="77" 
          result="coarsegrain"
        />
        
        <feColorMatrix 
          in="coarsegrain" 
          type="saturate" 
          values="0" 
          result="graycoarse"
        />
        
        {/* Blend the coarse grain with the adjusted stroke */}
        <feComposite 
          in="adjusted" 
          in2="graycoarse" 
          operator="atop" 
          result="layered"
        />
        
        {/* Final opacity adjustment for natural pencil feel */}
        <feComponentTransfer in="layered">
          <feFuncR type="identity"/>
          <feFuncG type="identity"/>
          <feFuncB type="identity"/>
          {/* Final alpha: creates the characteristic Mischief semi-transparent edges */}
          <feFuncA type="gamma" amplitude="1.1" exponent="1.3" offset="-0.05"/>
        </feComponentTransfer>
      </filter>
      
      {/* Heavy pencil texture - More pressure, more opacity variation */}
      <filter id="pencilTextureHeavy" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="3.0 2.2" 
          numOctaves="5" 
          seed="200" 
          result="heavynoise"
        />
        
        <feColorMatrix 
          in="heavynoise" 
          type="saturate" 
          values="0" 
          result="grayheavy"
        />
        
        <feComposite 
          in="SourceGraphic" 
          in2="grayheavy" 
          operator="in" 
          result="heavyOpacity"
        />
        
        <feGaussianBlur 
          in="heavyOpacity" 
          stdDeviation="0.4" 
          result="heavySoft"
        />
        
        <feComponentTransfer in="heavySoft">
          <feFuncR type="identity"/>
          <feFuncG type="identity"/>
          <feFuncB type="identity"/>
          {/* More aggressive opacity variation for heavy strokes */}
          <feFuncA type="linear" slope="0.75" intercept="0.15"/>
        </feComponentTransfer>
      </filter>
      
      {/* Soft pencil texture - Light pressure, very transparent */}
      <filter id="pencilTextureSoft" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="1.8 1.2" 
          numOctaves="3" 
          seed="300" 
          result="softnoise"
        />
        
        <feColorMatrix 
          in="softnoise" 
          type="saturate" 
          values="0" 
          result="graysoft"
        />
        
        <feComposite 
          in="SourceGraphic" 
          in2="graysoft" 
          operator="in" 
          result="softOpacity"
        />
        
        <feGaussianBlur 
          in="softOpacity" 
          stdDeviation="1.0" 
          result="verySoft"
        />
        
        <feComponentTransfer in="verySoft">
          <feFuncR type="identity"/>
          <feFuncG type="identity"/>
          <feFuncB type="identity"/>
          {/* Very light opacity for soft, feathered strokes */}
          <feFuncA type="linear" slope="0.65" intercept="0.05"/>
        </feComponentTransfer>
      </filter>
      
      {/* Charcoal-style texture - Maximum opacity variation and grain */}
      <filter id="pencilTextureCharcoal" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence 
          type="turbulence" 
          baseFrequency="3.5 2.8" 
          numOctaves="6" 
          seed="400" 
          result="charcoalnoise"
        />
        
        <feColorMatrix 
          in="charcoalnoise" 
          type="saturate" 
          values="0" 
          result="graycharcoal"
        />
        
        {/* Extra coarse layer */}
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.5 0.3" 
          numOctaves="2" 
          seed="500" 
          result="verycoarse"
        />
        
        <feBlend 
          in="graycharcoal" 
          in2="verycoarse" 
          mode="multiply" 
          result="charcoalcombined"
        />
        
        <feComposite 
          in="SourceGraphic" 
          in2="charcoalcombined" 
          operator="in" 
          result="charcoalOpacity"
        />
        
        <feGaussianBlur 
          in="charcoalOpacity" 
          stdDeviation="0.6" 
          result="charcoalSoft"
        />
        
        <feComponentTransfer in="charcoalSoft">
          <feFuncR type="identity"/>
          <feFuncG type="identity"/>
          <feFuncB type="identity"/>
          {/* Maximum variation for charcoal effect */}
          <feFuncA type="linear" slope="0.70" intercept="0.08"/>
        </feComponentTransfer>
      </filter>
    </defs>
  );
}
