const services = [
  ['frontend', 'http://frontend:80/'],
  ['api-gateway', 'http://api-gateway:8080/health'],
  ['auth-service', 'http://auth-service:3001/health'],
  ['candidate-service', 'http://candidate-service:3002/health'],
  ['cv-extraction-service', 'http://cv-extraction-service:4001/health'],
  ['cv-matching-service', 'http://cv-matching-service:4002/health'],
  ['attrition-service', 'http://attrition-service:4003/health'],
  ['job-service', 'http://job-service:4004/health'],
  ['speech-to-text-service', 'http://speech-to-text-service:4005/health'],
  ['interview-analysis-service', 'http://interview-analysis-service:4006/health'],
  ['cv-profile-analysis-service', 'http://cv-profile-analysis-service:4007/health'],
  ['attrition-model-service', 'http://attrition-model-service:4008/health'],
  ['resume-strength-model-service', 'http://resume-strength-model-service:4009/health'],
  ['interview-answer-model-service', 'http://interview-answer-model-service:4010/health'],
  ['early-attrition-model-service', 'http://early-attrition-model-service:4011/health'],
  ['resume-explanation-model-service', 'http://resume-explanation-model-service:4012/health']
];

async function run() {
  console.log('| Service | Container | Health Endpoint | HTTP Result | Status |');
  console.log('| ------- | --------- | --------------- | ----------: | ------ |');
  for (const [name, url] of services) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const status = res.ok ? 'HEALTHY' : 'UNHEALTHY';
      console.log(`| ${name} | r26-it-082-${name}-1 | ${url} | ${res.status} | ${status} |`);
    } catch (err) {
      console.log(`| ${name} | r26-it-082-${name}-1 | ${url} | ERROR: ${err.message} | UNREACHABLE |`);
    }
  }
}

run();
