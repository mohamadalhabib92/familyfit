Pod::Spec.new do |s|
  s.name           = 'FamilyfitSession'
  s.version        = '1.0.0'
  s.summary        = 'AVSpeechSynthesizer, audio ducking and a single session clock. iOS and tvOS.'
  s.homepage       = 'https://github.com/mohamadalhabib92/familyfit'
  s.license        = 'MIT'
  s.author         = 'FamilyFit'
  s.source         = { git: '' }
  s.platforms      = { :ios => '15.1', :tvos => '16.4' }
  s.swift_version  = '5.9'
  s.source_files   = 'ios/**/*.{h,m,mm,swift}'
  s.frameworks     = 'AVFoundation'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
