// Local Includes
#include "feedbackshaderservice.h"

// External Includes
#include <nap/core.h>
#include <nap/resourcemanager.h>
#include <nap/logger.h>
#include <iostream>

RTTI_BEGIN_CLASS_NO_DEFAULT_CONSTRUCTOR(nap::FeedbackShaderService)
	RTTI_CONSTRUCTOR(nap::ServiceConfiguration*)
RTTI_END_CLASS

namespace nap
{
	bool FeedbackShaderService::init(nap::utility::ErrorState& errorState)
	{
		//Logger::info("Initializing FeedbackShaderService");
		return true;
	}


	void FeedbackShaderService::update(double deltaTime)
	{
	}
	

	void FeedbackShaderService::getDependentServices(std::vector<rtti::TypeInfo>& dependencies)
	{
	}
	

	void FeedbackShaderService::shutdown()
	{
	}
}
