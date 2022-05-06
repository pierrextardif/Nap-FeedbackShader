// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

#version 450 core

// vertex shader input  
in vec3 passUVs;						//< frag Uv's 

// uniform inputs
uniform sampler2D TexFeedbackA;
uniform sampler2D TexFeedbackB;

uniform UBuff{
	uniform int even;
	uniform float time;
}uBuff;


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

void main() 
{
	vec4 O = vec4(0.);
	O = vec4(texPicker(TexFeedbackA, TexFeedbackB, uBuff.even, passUVs.xy), 1.0);
	out_Color = O;
}