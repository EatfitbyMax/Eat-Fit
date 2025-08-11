
import Foundation
import StoreKit
import React

@objc(StoreKitManager)
class StoreKitManager: NSObject, ObservableObject {
    
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    
    private var updateListenerTask: Task<Void, Error>? = nil
    
    override init() {
        super.init()
        
        // Écouter les mises à jour de transactions
        updateListenerTask = listenForTransactions()
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - React Native Methods
    
    @objc
    func initialize(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task { @MainActor in
            do {
                await self.checkCurrentEntitlements()
                resolve(true)
            } catch {
                reject("STOREKIT_ERROR", "Failed to initialize StoreKit", error)
            }
        }
    }
    
    @objc
    func loadProducts(_ productIds: [String], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task { @MainActor in
            do {
                let storeProducts = try await Product.products(for: Set(productIds))
                self.products = Array(storeProducts)
                
                let productsData = storeProducts.map { product in
                    return [
                        "id": product.id,
                        "displayName": product.displayName,
                        "description": product.description,
                        "displayPrice": product.displayPrice,
                        "price": product.price,
                        "priceFormatStyle": [
                            "currency": product.priceFormatStyle.currencyCode ?? "EUR"
                        ],
                        "type": product.type == .autoRenewable ? "subscription" : "consumable"
                    ]
                }
                
                resolve(productsData)
            } catch {
                reject("PRODUCTS_ERROR", "Failed to load products", error)
            }
        }
    }
    
    @objc
    func purchase(_ productId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task { @MainActor in
            guard let product = self.products.first(where: { $0.id == productId }) else {
                reject("PRODUCT_NOT_FOUND", "Product not found", nil)
                return
            }
            
            do {
                let result = try await product.purchase()
                
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        // Transaction vérifiée avec succès
                        self.purchasedProductIDs.insert(transaction.productID)
                        await transaction.finish()
                        
                        let transactionData = [
                            "status": "success",
                            "transaction": [
                                "id": String(transaction.id),
                                "productID": transaction.productID,
                                "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                                "expirationDate": transaction.expirationDate?.timeIntervalSince1970 ?? 0,
                                "verified": true
                            ]
                        ]
                        
                        resolve(transactionData)
                        
                    case .unverified(_, let error):
                        // Transaction non vérifiée
                        reject("VERIFICATION_FAILED", "Transaction verification failed", error)
                    }
                    
                case .userCancelled:
                    resolve(["status": "userCancelled"])
                    
                case .pending:
                    resolve(["status": "pending"])
                    
                @unknown default:
                    reject("UNKNOWN_RESULT", "Unknown purchase result", nil)
                }
                
            } catch {
                reject("PURCHASE_ERROR", "Purchase failed", error)
            }
        }
    }
    
    @objc
    func currentEntitlements(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task { @MainActor in
            var entitlements: [[String: Any]] = []
            
            for await result in Transaction.currentEntitlements {
                switch result {
                case .verified(let transaction):
                    entitlements.append([
                        "id": String(transaction.id),
                        "productID": transaction.productID,
                        "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                        "expirationDate": transaction.expirationDate?.timeIntervalSince1970 ?? 0,
                        "verified": true
                    ])
                    
                case .unverified(_, _):
                    // Ignorer les transactions non vérifiées
                    continue
                }
            }
            
            resolve(entitlements)
        }
    }
    
    @objc
    func restorePurchases(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task { @MainActor in
            do {
                try await AppStore.sync()
                await self.checkCurrentEntitlements()
                
                let restored = Array(self.purchasedProductIDs).map { productId in
                    return ["productId": productId, "restored": true]
                }
                
                resolve(["success": true, "purchases": restored])
            } catch {
                reject("RESTORE_ERROR", "Failed to restore purchases", error)
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.updatePurchasedProducts()
                    await transaction.finish()
                } catch {
                    print("Transaction failed verification")
                }
            }
        }
    }
    
    @MainActor
    private func checkCurrentEntitlements() async {
        purchasedProductIDs.removeAll()
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                purchasedProductIDs.insert(transaction.productID)
            } catch {
                print("Failed to verify transaction")
            }
        }
    }
    
    @MainActor
    private func updatePurchasedProducts() async {
        purchasedProductIDs.removeAll()
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                purchasedProductIDs.insert(transaction.productID)
            } catch {
                print("Failed to verify transaction")
            }
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
}

enum StoreError: Error {
    case failedVerification
}
