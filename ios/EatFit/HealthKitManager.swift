
import Foundation
import HealthKit
import React

@objc(HealthKitManager)
class HealthKitManager: NSObject, RCTBridgeModule {
  
  private let healthStore = HKHealthStore()
  
  static func moduleName() -> String! {
    return "HealthKitManager"
  }
  
  @objc
  func isAvailable(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(HKHealthStore.isHealthDataAvailable())
  }
  
  @objc
  func requestPermissions(_ options: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let readTypes = options["read"] as? [String],
          let writeTypes = options["write"] as? [String] else {
      reject("INVALID_PARAMS", "Invalid permission parameters", nil)
      return
    }
    
    let readPermissions = Set(readTypes.compactMap { getHealthKitType(for: $0) })
    let writePermissions = Set(writeTypes.compactMap { getHealthKitType(for: $0) })
    
    healthStore.requestAuthorization(toShare: writePermissions, read: readPermissions) { success, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("PERMISSION_ERROR", error.localizedDescription, error)
        } else {
          resolve(["granted": success])
        }
      }
    }
  }
  
  @objc
  func getPermissions(_ options: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let readTypes = options["read"] as? [String] else {
      reject("INVALID_PARAMS", "Invalid permission parameters", nil)
      return
    }
    
    let readPermissions = readTypes.compactMap { getHealthKitType(for: $0) }
    
    var allGranted = true
    for type in readPermissions {
      let status = healthStore.authorizationStatus(for: type)
      if status != .sharingAuthorized {
        allGranted = false
        break
      }
    }
    
    resolve(["granted": allGranted])
  }
  
  @objc
  func readSteps(_ startDateString: String, endDate endDateString: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount),
          let startDate = ISO8601DateFormatter().date(from: startDateString),
          let endDate = ISO8601DateFormatter().date(from: endDateString) else {
      reject("INVALID_PARAMS", "Invalid parameters for reading steps", nil)
      return
    }
    
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
    
    let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("READ_ERROR", error.localizedDescription, error)
        } else {
          let steps = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
          resolve(Int(steps))
        }
      }
    }
    
    healthStore.execute(query)
  }
  
  @objc
  func readHeartRate(_ startDateString: String, endDate endDateString: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate),
          let startDate = ISO8601DateFormatter().date(from: startDateString),
          let endDate = ISO8601DateFormatter().date(from: endDateString) else {
      reject("INVALID_PARAMS", "Invalid parameters for reading heart rate", nil)
      return
    }
    
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictEndDate)
    let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
    
    let query = HKSampleQuery(sampleType: heartRateType, predicate: predicate, limit: 1, sortDescriptors: [sortDescriptor]) { _, samples, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("READ_ERROR", error.localizedDescription, error)
        } else if let sample = samples?.first as? HKQuantitySample {
          let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
          resolve(Int(heartRate))
        } else {
          resolve(0)
        }
      }
    }
    
    healthStore.execute(query)
  }
  
  @objc
  func readWeight(_ startDateString: String, endDate endDateString: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass),
          let startDate = ISO8601DateFormatter().date(from: startDateString),
          let endDate = ISO8601DateFormatter().date(from: endDateString) else {
      reject("INVALID_PARAMS", "Invalid parameters for reading weight", nil)
      return
    }
    
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictEndDate)
    let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
    
    let query = HKSampleQuery(sampleType: weightType, predicate: predicate, limit: 1, sortDescriptors: [sortDescriptor]) { _, samples, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("READ_ERROR", error.localizedDescription, error)
        } else if let sample = samples?.first as? HKQuantitySample {
          let weight = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))
          resolve(weight)
        } else {
          resolve(NSNull())
        }
      }
    }
    
    healthStore.execute(query)
  }
  
  @objc
  func readActiveCalories(_ startDateString: String, endDate endDateString: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
          let startDate = ISO8601DateFormatter().date(from: startDateString),
          let endDate = ISO8601DateFormatter().date(from: endDateString) else {
      reject("INVALID_PARAMS", "Invalid parameters for reading active calories", nil)
      return
    }
    
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
    
    let query = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("READ_ERROR", error.localizedDescription, error)
        } else {
          let calories = result?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
          resolve(Int(calories))
        }
      }
    }
    
    healthStore.execute(query)
  }
  
  @objc
  func readDistance(_ startDateString: String, endDate endDateString: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning),
          let startDate = ISO8601DateFormatter().date(from: startDateString),
          let endDate = ISO8601DateFormatter().date(from: endDateString) else {
      reject("INVALID_PARAMS", "Invalid parameters for reading distance", nil)
      return
    }
    
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
    
    let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("READ_ERROR", error.localizedDescription, error)
        } else {
          let distance = result?.sumQuantity()?.doubleValue(for: .meter()) ?? 0
          resolve(Int(distance))
        }
      }
    }
    
    healthStore.execute(query)
  }
  
  @objc
  func readSleepAnalysis(_ startDateString: String, endDate endDateString: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
          let startDate = ISO8601DateFormatter().date(from: startDateString),
          let endDate = ISO8601DateFormatter().date(from: endDateString) else {
      reject("INVALID_PARAMS", "Invalid parameters for reading sleep analysis", nil)
      return
    }
    
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
    
    let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("READ_ERROR", error.localizedDescription, error)
        } else {
          var totalSleepHours: Double = 0
          
          if let sleepSamples = samples as? [HKCategorySample] {
            for sample in sleepSamples {
              if sample.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue ||
                 sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue ||
                 sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                 sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue {
                let duration = sample.endDate.timeIntervalSince(sample.startDate)
                totalSleepHours += duration / 3600 // Convertir en heures
              }
            }
          }
          
          resolve(totalSleepHours)
        }
      }
    }
    
    healthStore.execute(query)
  }
  
  @objc
  func writeWeight(_ weight: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass) else {
      reject("INVALID_TYPE", "Invalid weight type", nil)
      return
    }
    
    let weightQuantity = HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: weight)
    let weightSample = HKQuantitySample(type: weightType, quantity: weightQuantity, start: Date(), end: Date())
    
    healthStore.save(weightSample) { success, error in
      DispatchQueue.main.async {
        if let error = error {
          reject("WRITE_ERROR", error.localizedDescription, error)
        } else {
          resolve(success)
        }
      }
    }
  }
  
  private func getHealthKitType(for identifier: String) -> HKObjectType? {
    switch identifier {
    case "HKQuantityTypeIdentifierStepCount":
      return HKQuantityType.quantityType(forIdentifier: .stepCount)
    case "HKQuantityTypeIdentifierHeartRate":
      return HKQuantityType.quantityType(forIdentifier: .heartRate)
    case "HKQuantityTypeIdentifierBodyMass":
      return HKQuantityType.quantityType(forIdentifier: .bodyMass)
    case "HKQuantityTypeIdentifierHeight":
      return HKQuantityType.quantityType(forIdentifier: .height)
    case "HKQuantityTypeIdentifierBodyMassIndex":
      return HKQuantityType.quantityType(forIdentifier: .bodyMassIndex)
    case "HKQuantityTypeIdentifierActiveEnergyBurned":
      return HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
    case "HKQuantityTypeIdentifierDistanceWalkingRunning":
      return HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
    case "HKCategoryTypeIdentifierSleepAnalysis":
      return HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)
    case "HKQuantityTypeIdentifierRestingHeartRate":
      return HKQuantityType.quantityType(forIdentifier: .restingHeartRate)
    case "HKQuantityTypeIdentifierBloodPressureSystolic":
      return HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic)
    case "HKQuantityTypeIdentifierBloodPressureDiastolic":
      return HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic)
    default:
      return nil
    }
  }
}
