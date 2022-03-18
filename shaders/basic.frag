#version 410 core

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoords;
in vec4 fPosEye;

out vec4 fColor;

//matrices
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;
//lighting
uniform vec3 lightDir;
uniform vec3 lightColor;
// textures
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;

//components
vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;
float shininess = 32.0f;

//point light
uniform vec3 lightPosEye;
uniform vec3 viewPos;
float constant = 1.0f;
float linear = 0.09f;
//float linear = 10.0f;
float quadratic = 0.032f;
//float quadratic = 3.0f;
uniform vec3 lightColorPoint;

vec3 ambientPoint;
vec3 diffusePoint;
vec3 specularPoint;

//fog
uniform	int startFog;

void computeDirLight()
{
    //compute eye space coordinates
    vec4 fPosEye = view * model * vec4(fPosition, 1.0f);
    vec3 normalEye = normalize(normalMatrix * fNormal);

    //normalize light direction
    vec3 lightDirN = vec3(normalize(view * vec4(lightDir, 0.0f)));

    //compute view direction (in eye coordinates, the viewer is situated at the origin
    vec3 viewDir = normalize(-fPosEye.xyz);

    //compute ambient light
    ambient = ambientStrength * lightColor;

    //compute diffuse light
    diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;

    //compute specular light
    vec3 reflectDir = reflect(-lightDirN, normalEye);
    float specCoeff = pow(max(dot(viewDir, reflectDir), 0.0f), shininess);
    specular = specularStrength * specCoeff * lightColor;
}

void computePointLight()
{
    vec3 normalEye = normalize(normalMatrix * fNormal);
    vec3 lightDirN = normalize(lightPosEye - fPosEye.xyz);
    //compute distance to light
    float dist = length(lightPosEye - fPosEye.xyz);

    //compute attenuation
    float att = 1.0f / (constant + linear * dist + quadratic * (dist * dist));

    //compute abient light 
    ambientPoint = att * ambientStrength * lightColorPoint;

    //compute difffuse light 
    diffusePoint = att * max(dot(normalEye, lightDirN), 0.0f) * lightColorPoint;

    //compute specular light 
    vec3 viewDirN = normalize(-fPosEye.xyz);
    vec3 reflection = reflect(-lightDirN, normalEye);
    float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
    specularPoint = att * specularStrength * specCoeff * lightColorPoint;
}

float computeFog()
{
    float fogDensity = 0.3f;
    float fragmentDistance = length(fPosEye);
    float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));

    return clamp(fogFactor, 0.0f, 1.0f);
}

void main() 
{
    computeDirLight();
    computePointLight();

    //compute final vertex color
    vec3 color = min((ambient + diffuse) * texture(diffuseTexture, fTexCoords).rgb + specular * texture(specularTexture, fTexCoords).rgb, 1.0f);
    vec3 colorPoint = min((ambientPoint + diffusePoint) * texture(diffuseTexture, fTexCoords).rgb + specularPoint * texture(specularTexture, fTexCoords).rgb, 1.0f);
    //fColor = vec4((color + colorPoint), 1.0f);
    
    vec4 colorFromTexture = texture(diffuseTexture, fTexCoords);
    if(colorFromTexture.r == 0.0 && colorFromTexture.g== 0.0 && colorFromTexture.b == 0.0 )
		discard;
    //fColor = vec4((color + colorPoint), 1.0f);

    float fogFactor = computeFog();
    vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);
    
    //fColor = fogColor*(1–fogFactor) + vec4((color + colorPoint), 1.0f)*fogFactor;
    if(startFog == 1)
    	fColor = mix(fogColor, vec4(color, 1.0f), fogFactor);
    else
        fColor = vec4((color + colorPoint), 1.0f);
    
}
