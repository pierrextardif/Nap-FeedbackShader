// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

#version 450 core
precision highp float;

// vertex shader input  
in vec3 passUVs;						//< frag Uv's 

uniform UBuff{
	uniform int even;
	uniform float time;
	uniform vec2 res;
}uBuff;

// uniform inputs
uniform sampler2D Texfeedback;

// output
out vec4 out_Color;



// ====

vec4 t_(sampler2D tex, vec2 uv){return texture(tex, uv);}


float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                * 43758.5453123);
}



float Hash(vec2 p){
    p = fract(p * vec2( 123.34, 456.21));
    p += dot(p, p + 5.32);
    return fract(p.x*p.y);
}

float noise(vec2 st, vec2 speed) {
    
    st += speed;
    
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f);
    return mix( mix( Hash( i + vec2(0.0,0.0) ),
                     Hash( i + vec2(1.0,0.0) ), u.x),
                mix( Hash( i + vec2(0.0,1.0) ),
                     Hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

float noise(vec2 st) {
    return noise(st, vec2(0));
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}



float remap(float xIn, vec2 scale1, vec2 scale2)
{
	return scale2.x + (scale2.y - scale2.x) * ((xIn - scale1.x) / (scale1.y - scale1.x));
}


vec3 miniTransformColors(vec3 c, float time, float n)
{
    vec3 col = rgb2hsv(c);
    
    float thresholdHue = sin(time + n) + 1.;
    col.r = remap(col.r, vec2(0., 1.), vec2(0., thresholdHue));
    
    if(col.r > thresholdHue / 2.0)col.r = thresholdHue-col.r;
    col.r += 1. - thresholdHue;
    
    
    // float thresholdSat = sin(time) * .5 + .5;
    // col.g = remap(col.g, vec2(0., 1.), vec2(0., thresholdSat));
    // if(col.g > thresholdSat / 2.0)col.g = thresholdSat-col.g;
    // col.g += 1. - thresholdSat;
    
    /*
    float thresholdBright = cos(time) * .2 + .2;
    col.b = remap(col.b, vec2(0, 1.), vec2(0., thresholdBright));
    if(col.b > thresholdBright / 2.0)col.b = thresholdBright - col.b;
    col.b += .6;
    */
    
    
    
    
    return hsv2rgb(col);
}

void main( void )
{

	// uniforms
	float u_time = uBuff.time;
	vec2 u_resImg = uBuff.res;
    
    float n = noise(passUVs.xy * u_resImg  / vec2(6.), vec2(0., u_time * 5.));
    
    vec2 U = passUVs.xy * u_resImg;
    vec2 oSpeed = u_resImg.xy * (sin(u_time * .1) * .05 + .1);
    
    vec4 O=t_(Texfeedback, fract(U/(u_resImg.xy - oSpeed)))+sin(U.xyyy/50.)/(u_time);
    float amnt = 7. * abs(sin(u_time *.1) ) + 6.;
    
    for(float i = 0.;i< amnt ;i+=1.0){
        
        vec2 v1 = fract((U - O.yx) / (u_resImg.xy + sin(u_time * 1.) * i ) );
        vec2 v2 = fract((U - O.xy) / (u_resImg.xy + cos(u_time * 2.) * i * 2. ) );
        O += (1. + .01 * sin(u_time * .1) ) * t_(Texfeedback, v1 );
    	O -= (1. + .01 * cos(u_time * .3) ) * t_(Texfeedback, v2 );
        
    }
	
    O = normalize(t_(Texfeedback, fract((U + O.yx)/u_resImg.xy)) +.02 * cos(u_time *.4)*O.wxyz);
    O.rgb =O.rgb* .97+.03* miniTransformColors(O.rgb, u_time * 5., passUVs.y).rgb;

    float prop = sin(u_time) * .1 + .4;
    O = t_(Texfeedback, passUVs.xy) * (1. - prop) + prop * O;
    out_Color = O;
}