Pod::Spec.new do |s|
  s.name           = 'FamilyfitHealth'
  s.version        = '1.0.0'
  s.summary        = 'Optional HealthKit bridge. Not built for tvOS.'
  s.homepage       = 'https://github.com/mohamadalhabib92/familyfit'
  s.license        = 'MIT'
  s.author         = 'FamilyFit'
  s.source         = { git: '' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source_files   = 'ios/**/*.{h,m,mm,swift}'
  s.frameworks     = 'HealthKit'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
