#include "feedbackshaderapp.h"


// External Includes
#include <utility/fileutils.h>
#include <nap/logger.h>
#include <inputrouter.h>
#include <rendergnomoncomponent.h>
#include <orthocameracomponent.h>


#include <renderablemeshcomponent.h>
#include <rendertotexturecomponent.h>

RTTI_BEGIN_CLASS_NO_DEFAULT_CONSTRUCTOR(nap::FeedbackShaderApp)
	RTTI_CONSTRUCTOR(nap::Core&)
RTTI_END_CLASS

namespace nap 
{
	/**
	 * Initialize all the resources and instances used for drawing
	 * slowly migrating all functionality to NAP
	 */
	bool FeedbackShaderApp::init(utility::ErrorState& error)
	{
		// Retrieve services
		mRenderService	= getCore().getService<nap::RenderService>();
		mSceneService	= getCore().getService<nap::SceneService>();
		mInputService	= getCore().getService<nap::InputService>();
		mGuiService		= getCore().getService<nap::IMGuiService>();

		// Fetch the resource manager
		mResourceManager = getCore().getResourceManager();

		// Get the render window
		mRenderWindow = mResourceManager->findObject<nap::RenderWindow>("Window");
		if (!error.check(mRenderWindow != nullptr, "unable to find render window with name: %s", "Window"))
			return false;

		// Get the scene that contains our entities and components
		mScene = mResourceManager->findObject<Scene>("Scene");
		if (!error.check(mScene != nullptr, "unable to find scene with name: %s", "Scene"))
			return false;

		// Get the camera entity
		mCameraEntity = mScene->findEntity("CameraEntity");
		if (!error.check(mCameraEntity != nullptr, "unable to find camera entity with name: %s", "CameraEntityxz"))
			return false;



		// ==== feedback ====
		mBuffAEntity = mScene->findEntity("BuffAEntity");
		if (!error.check(mBuffAEntity != nullptr, "unable to find image source entity with name: %s", "BuffAEntity"))
			return false;

		mBuffBEntity = mScene->findEntity("BuffBEntity");
		if (!error.check(mBuffBEntity != nullptr, "unable to find image source entity with name: %s", "BuffBEntity"))
			return false;


		mFeedbackEntity = mScene->findEntity("FeedbackEntity");
		if (!error.check(mFeedbackEntity != nullptr, "unable to find feedback holder entity with name : %s", "FeedbackEntity"))
			return false;

		even = false;


		positionBackground();

		// All done!
		return true;
	}
	
	
	// Called when the window is updating
	void FeedbackShaderApp::update(double deltaTime)
	{
		// Use a default input router to forward input events (recursively) to all input components in the default scene
		nap::DefaultInputRouter input_router(true);
		mInputService->processWindowEvents(*mRenderWindow, input_router, { &mScene->getRootEntity() });

	}
	
	
	// Called when the window is going to render     
	void FeedbackShaderApp::render()
	{
		// Signal the beginning of a new frame, allowing it to be recorded.
		// The system might wait until all commands that were previously associated with the new frame have been processed on the GPU.
		// Multiple frames are in flight at the same time, but if the graphics load is heavy the system might wait here to ensure resources are available.
		mRenderService->beginFrame();

		if (mRenderService->beginHeadlessRecording())
		{
			runFeedback();
			mRenderService->endHeadlessRecording();
		}
		// Begin recording the render commands for the main render window
		if (mRenderService->beginRecording(*mRenderWindow))
		{
			// Begin render pass
			mRenderWindow->beginRendering();

			// Get Perspective camera to render with
			auto& ortho_cam = mCameraEntity->getComponent<OrthoCameraComponentInstance>();

			// Add Gnomon
			std::vector<nap::RenderableComponentInstance*> components_to_render
			{
				&mFeedbackEntity->getComponent<RenderableComponentInstance>()
			};

			// Render elements
			mRenderService->renderObjects(*mRenderWindow, ortho_cam, components_to_render);

			// Render GUI elements
			mGuiService->draw();

			// Stop render pass
			mRenderWindow->endRendering();

			// End recording
			mRenderService->endRecording();
		}

		// Proceed to next frame
		mRenderService->endFrame();

	}
	

	void FeedbackShaderApp::windowMessageReceived(WindowEventPtr windowEvent)
	{
		mRenderService->addEvent(std::move(windowEvent));
	}
	
	
	void FeedbackShaderApp::inputMessageReceived(InputEventPtr inputEvent)
	{
		if (inputEvent->get_type().is_derived_from(RTTI_OF(nap::KeyPressEvent)))
		{
			// If we pressed escape, quit the loop
			nap::KeyPressEvent* press_event = static_cast<nap::KeyPressEvent*>(inputEvent.get());
			if (press_event->mKey == nap::EKeyCode::KEY_ESCAPE)
				quit();

			// f is pressed, toggle full-screen
			if (press_event->mKey == nap::EKeyCode::KEY_f)
			{
				mRenderWindow->toggleFullscreen();
				positionBackground();
			}
		}
		// Add event, so it can be forwarded on update
		mInputService->addEvent(std::move(inputEvent));
	}

	
	int FeedbackShaderApp::shutdown()
	{
		return 0;
	}


	void FeedbackShaderApp::runFeedback()
	{

		even = !even;
		RenderToTextureComponentInstance& r = even ? mBuffAEntity->getComponent< RenderToTextureComponentInstance >() : mBuffBEntity->getComponent<RenderToTextureComponentInstance>();
		
		auto* frag_ubo = r.getMaterialInstance().getOrCreateUniform("UBuff");
		if (frag_ubo != nullptr)
		{

			auto* time_passed = frag_ubo->getOrCreateUniform<UniformFloatInstance>("time");
			time_passed->setValue(time_passed_test);
		}

		r.draw();

		RenderableMeshComponentInstance& renderableMeshComponentInstance = mFeedbackEntity->getComponent< RenderableMeshComponentInstance >();

		auto* frag_feedback_ubo = renderableMeshComponentInstance.getMaterialInstance().getOrCreateUniform("UBuff");
		if (frag_feedback_ubo != nullptr)
		{
			auto* sampler_index = frag_feedback_ubo->getOrCreateUniform<UniformIntInstance>("even");
			sampler_index->setValue(even ? 0 : 1);

			auto* time_passed = frag_feedback_ubo->getOrCreateUniform<UniformFloatInstance>("time");
			time_passed->setValue(time_passed_test);
		}

		time_passed_test += .0001;
	}


	void FeedbackShaderApp::positionBackground() {

		float window_width = static_cast<float>(mRenderWindow->getWidthPixels());
		float window_heigh = static_cast<float>(mRenderWindow->getHeightPixels());

		float window_ratio = window_width / window_heigh;

		glm::vec3 plane_size = { window_width, window_heigh, 1.0 };
		
		glm::vec2 offset = { window_width / 2, window_heigh / 2 };

		// Get transform and push
		TransformComponentInstance& transform = mFeedbackEntity->getComponent<TransformComponentInstance>();
		transform.setTranslate(glm::vec3(offset.x, offset.y, 0.0f));
		transform.setScale(plane_size);
	}

}
