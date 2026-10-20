import { jobPostsRepository } from "./jobPostsRepository.js";
import { applicationsRepository } from "./applicationsRepository.js";
import { interviewsRepository } from "./interviewsRepository.js";
import { interviewRoomRepository } from "./interviewRoomRepository.js";
import { interviewTranscriptRepository } from "./interviewTranscriptRepository.js";

export const jobRepository = { ...jobPostsRepository, ...applicationsRepository, ...interviewsRepository, ...interviewRoomRepository, ...interviewTranscriptRepository };
