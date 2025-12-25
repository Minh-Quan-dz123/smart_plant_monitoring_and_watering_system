package com.example.project_iot_auto_watering.ui.sensor

import android.Manifest
import android.annotation.SuppressLint
import android.app.Dialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.ScanResult
import android.net.wifi.WifiManager
import android.net.wifi.WifiNetworkSpecifier
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresPermission
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.DialogWifiEspBinding
import com.example.project_iot_auto_watering.databinding.FragmentSensorBinding
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import com.example.project_iot_auto_watering.ui.sensor.adapter.AdapterDevice
import com.example.project_iot_auto_watering.ui.sensor.adapter.AdapterWifi
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient


class FragmentSensor : Fragment(), View.OnClickListener {
    private var _binding: FragmentSensorBinding? = null
    private val binding get() = _binding!!

    private lateinit var gardenViewModel: GardenViewModel
    private val gardenRepository = GardenRepository(RetrofitInstance.api)

    private lateinit var adapterDevice: AdapterDevice
    private lateinit var rcvDevice: RecyclerView
    private lateinit var adapterWifi: AdapterWifi
    private val listEsp: MutableList<DataEspAll> = mutableListOf()

    private var tokenAuth: String? = ""
    var cntClickWifi = 0
    private val listSsidWifi = mutableListOf<String>()

    private lateinit var dialog: Dialog
    private var wifiReceiver: BroadcastReceiver? = null


    val client = OkHttpClient()
    val urlWifi = "http://192.168.4.1"

    //quyền quét wifi
    private val requestLocationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                scanWifi()
            } else {
                Toast.makeText(requireContext(), "Xin quyền bị từ chối!", Toast.LENGTH_SHORT).show()
            }
        }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSensorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        dialog = Dialog(requireContext())
        tokenAuth = requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE)
            .getString("token", "")

        initViewModel()
        initObserve()
        initAdapter()
        initListener()
    }

    private fun initListener() {
        binding.iconBack.setOnClickListener(this)
    }

    private fun initViewModel() {
        gardenViewModel = ViewModelProvider(
            requireActivity(),
            GardenVMFactory(gardenRepository)
        )[GardenViewModel::class.java]

        gardenViewModel.getAllDataEsp(tokenAuth.toString()) {}

    }

    private fun initAdapter() {

        rcvDevice = binding.rcvSensor
        adapterDevice = AdapterDevice(listEsp) { isState ->
            if (isState) {
                if (cntClickWifi == 0) {
                    Toast.makeText(
                        requireContext(), "Đã kết nối, click lần 2 để ngắt kết nối!",
                        Toast.LENGTH_SHORT
                    ).show()
                    cntClickWifi++
                } else {
                    val dialogConfirm = AlertDialog.Builder(requireContext())
                        .setTitle("Wifi connecting...")
                        .setMessage("Bạn có muốn tắt kết nối wifi không ?")
                        .setPositiveButton("Có") { _, _ ->

                        }
                        .setNegativeButton("Không") { dialog, _ ->
                            dialog.dismiss()
                        }

                    dialogConfirm.show()
                }
            } else {
//                val dialogConnect = AlertDialog.Builder(requireContext())
//                    .setMessage("Connect Wifi for ESP")
//                    .setMessage("Bạn có muốn kết nối wifi cho esp không?")
//                    .setPositiveButton("Có") { _, _ ->
//                    }
//                    .setNegativeButton("Không") { dialog, _ ->
//                        dialog.dismiss()
//                    }
//
//                dialogConnect.show()
                lifecycleScope.launch {
                    //kết nối bên thứ 3
//                    openSmartConfigApp()

                    //đảm bảo wifi, location được bật
                    ensureWifiAndLocationEnabled()
                    //kết nối wifi cho esp dựa trên việc scan wifi
                    checkPermissionAndScan()

                    for (i in 1..12) {
                        //cập nhật lại các esp khi trong vòng 3 phút kết nối
                        gardenViewModel.getAllDataEsp(tokenAuth.toString()) {}
                        delay(15000)
                    }
                }
            }
        }

        rcvDevice.layoutManager = LinearLayoutManager(requireContext())
        rcvDevice.adapter = adapterDevice
    }

    @SuppressLint("NotifyDataSetChanged")
    private fun initObserve() {
        gardenViewModel.listEspDevice.observe(viewLifecycleOwner) { list ->
            listEsp.clear()
            listEsp.addAll(list)
            adapterDevice.notifyDataSetChanged()
        }
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.icon_back -> {
                Toast.makeText(requireContext(), "Click", Toast.LENGTH_SHORT).show()
            }
        }
    }


    private fun checkPermissionAndScan() {
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestLocationPermission.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        } else {
            scanWifi()
        }
    }

    private fun openSmartConfigApp() {
        val packageName = "com.haidang.iap2app"

        try {
            val intent = requireActivity()
                .packageManager.getLaunchIntentForPackage(packageName)

            if (intent != null) {
                // Ứng dụng đã được cài đặt, mở trực tiếp
                startActivity(intent)
            } else {
                // Ứng dụng chưa được cài đặt, chuyển hướng đến Play Store
                // SỬA: Dùng chuỗi template Kotlin để đưa giá trị biến vào URL
                val intentGg = Intent(
                    Intent.ACTION_VIEW,
                    "https://play.google.com/store/apps/details?id=$packageName".toUri()
                )
                startActivity(intentGg)
                Toast.makeText(
                    requireContext(),
                    "App SmartConfig chưa được cài!",
                    Toast.LENGTH_SHORT
                ).show()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(requireContext(), "Không thể mở SmartConfig!", Toast.LENGTH_SHORT).show()
        }
    }

    @RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
    private fun scanWifi() {
        binding.progressBar.visibility= View.VISIBLE
        val wifiManager = requireContext().getSystemService(WifiManager::class.java)

        wifiReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val results = wifiManager.scanResults
                processResults(results)

                // UNREGISTER NGAY SAU KHI NHẬN
                requireActivity().unregisterReceiver(this)
                wifiReceiver = null
                binding.progressBar.visibility= View.GONE
            }
        }

        requireActivity().registerReceiver(
            wifiReceiver,
            IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION)
        )

        wifiManager.startScan()
    }
    private fun ensureWifiAndLocationEnabled() {
        val wifiManager = requireContext().getSystemService(WifiManager::class.java)
        if (wifiManager != null && wifiManager.isWifiEnabled) {

        } else {
            startActivity(Intent(Settings.ACTION_WIFI_SETTINGS))
        }
        val locationManager = requireContext().getSystemService(LocationManager::class.java)
        if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
        }
    }

    private fun processResults(rs: List<ScanResult>) {

        // Lấy danh sách SSID hợp lệ
        val wifiEsp = rs
            .map { it.wifiSsid.toString() }
            .filter { it.isNotEmpty() }
            .distinct()

        if (wifiEsp.isEmpty()) return

        listSsidWifi.clear()
        listSsidWifi.addAll(wifiEsp)

        val item = DialogWifiEspBinding.inflate(layoutInflater)

        item.imgX.setOnClickListener {
            dialog.dismiss()
        }

        adapterWifi = AdapterWifi(listSsidWifi) { ssid ->
            // kết nối wifi
            connectWifi(ssid)
        }

        item.listWifi.apply {
            adapter = adapterWifi
            layoutManager =
                LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }

        dialog.setContentView(item.root)
        dialog.show()
    }

    private fun connectWifi(ssid: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val specifier = WifiNetworkSpecifier.Builder()
                .setSsid(ssid)
                .build()

            val request = NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .setNetworkSpecifier(specifier)
                .build()

            val connectivityManager =
                requireContext().getSystemService(ConnectivityManager::class.java)
            val networkCallback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    super.onAvailable(network)

                    //gắn với wifi esp
                    connectivityManager.bindProcessToNetwork(network)


                    requireActivity().runOnUiThread {
                        Toast.makeText(
                            requireContext(),
                            "Đã kết nối Wi-Fi của ESP!", Toast.LENGTH_SHORT
                        ).show()


                        val intent = Intent(Intent.ACTION_VIEW, urlWifi.toUri())
                        startActivity(intent)
                        lifecycleScope.launch {
                            dialog.dismiss()
                            delay(45000)
                            connectivityManager.bindProcessToNetwork(null)
                        }
                    }
                }

                override fun onUnavailable() {
                    super.onUnavailable()

                    //ngắt kết nối wifi esp tự động reconnect wifi ban đầu
                    connectivityManager.bindProcessToNetwork(null)
                    requireActivity().runOnUiThread {
                        Toast.makeText(
                            requireContext(),
                            "Không kết nối được Wi-Fi ESP, quay lại Wi-Fi trước đó",
                            Toast.LENGTH_SHORT
                        ).show()
                        dialog.dismiss()
                    }
                }
            }

            try {
                connectivityManager.requestNetwork(request, networkCallback)
            } catch (e: SecurityException) {
                e.printStackTrace()
                Toast.makeText(requireContext(), "Lỗi quyền truy cập mạng: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
    override fun onDestroyView() {
        super.onDestroyView()
        // Đảm bảo không rò rỉ receiver
        wifiReceiver?.let {
            try {
                requireActivity().unregisterReceiver(it)
            } catch (e: Exception) { }
            wifiReceiver = null
        }
        _binding = null
    }
}
