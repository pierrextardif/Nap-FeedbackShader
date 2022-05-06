// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

#version 450 core

//// classic stuff for all shaders
#define M_PI 3.1415926535897932
#define PI_2 1.57079632679

// vertex shader input  
in vec3 passUVs;						//< frag Uv's 

uniform UBuff{
	uniform int even;
	uniform float time;
	uniform vec2 res;
}uBuff;

// uniform inputs
uniform sampler2D Texfeedback;

vec3 texPicker(sampler2D t1, sampler2D t2, int even, vec2 uvs)
{
	if(even == 0){
		return texture(t1, uvs).rgb;
	}else{
		return texture(t2, uvs).rgb;
	}
}
// output
out vec4 out_Color;

// void main() 
// {
// 	out_Color = vec4(0.);
// }




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

float Hash22(vec2 p) {
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+45.32);
    return clamp(fract(p.x * p.y), 0.0, 1.0);
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

float slope=15.;

float posTri(float x)
{
    float r = abs(fract(x - .5) - .5)*2.;
    
    return r;
}

float spiral(vec2 pos, float slope, float time)
{
    float l=length(pos);
    float ang=atan(pos.y,pos.x) + 5.0*time;
    float r=posTri(ang/(2 * M_PI)+l/slope);
    return r;
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


void main( void )
{

	// uniforms
	float u_time = uBuff.time;
	vec2 u_resImg = uBuff.res;
    vec2 uv = passUVs.xy;
    vec2 tc = uv;
    float aspect = u_resImg.x / u_resImg.y;
    




    vec2 uvUnTempered = passUVs.xy;
    
    uv = uv * 2.0 - 1.0;
    uv.x *= aspect;
    
    
    float n = noise(passUVs.xy * 100.);
    
    uv += vec2(sin(u_time) , cos(u_time))*0.025;
    
    float sp_ = abs(spiral(uv, 2. * sin(u_time) + 2.1, u_time));
    vec2 dToCenter = abs(vec2(tc)  - .5);
    float dC = .5 - length(dToCenter  / (n * (9.9 * sin(u_time * .7) + 10)));
    float sp = sp_;
    sp *= dC;
    

    tc = 2.0 * tc - 1.0;
    tc *= 0.99;
    tc = (tc * 0.5 + 0.5);

    vec3 h = t_(Texfeedback, tc).rgb;
    h = rgb2hsv(h);
    h.r += u_time * .01;

    vec2 texel = 1.0 / u_resImg.xy;
    vec2 d = texel * .75;
    
    float sineCoeff = 6.283;
    sineCoeff = 7. + 3. * sin(u_time);
    vec3 p = t_(Texfeedback, tc).rgb;
    // + vec2(sin(h.r * sineCoeff) * .5,cos(h.r * sineCoeff))*d ).rgb;
    
    float f = pow(fract(sp), 3.5 + cos(u_time * 3.) * 3.);
    vec3 c = vec3(f ,0,0.0) + p;

    c = clamp(c, vec3(0.0), vec3(1.0));

    c = rgb2hsv(c);
    c.r += 0.002;
//    c.g +=  .04 * sp;
//    c.b += .0001 * cos(c.r);
//    c.b *= 1. + .01 * sp;
    
//    c.r *= dC;
    
    c = hsv2rgb(c);
    
    if(c.r > .99){
        c = fract(c.rgb);
    }
    
    //out_Color = vec4(c, 1.0);
    out_Color = vec4(vec3(c), 1.);
}