package com.example.project_iot_auto_watering.ui.sensor

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.net.toUri
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.airbnb.lottie.animation.content.Content
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentHomeContainerBinding
import com.example.project_iot_auto_watering.databinding.FragmentSensorBinding
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import com.example.project_iot_auto_watering.ui.sensor.adapter.AdapterDevice
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class FragmentSensor : Fragment(), View.OnClickListener {
    private var _binding: FragmentSensorBinding? = null
    private val binding get() = _binding!!

    private lateinit var gardenViewModel: GardenViewModel
    private val gardenRepository = GardenRepository(RetrofitInstance.api)

    private lateinit var adapterDevice: AdapterDevice
    private lateinit var rcvDevice: RecyclerView

    private val listEsp: MutableList<DataEspAll> = mutableListOf()

    private var tokenAuth: String? = ""
    var cntClickWifi=0

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
        adapterDevice = AdapterDevice(listEsp){isState->
            if(isState){
                if(cntClickWifi==0){
                    Toast.makeText(requireContext(),"Đã kết nối, click lần 2 để ngắt kết nối!",
                        Toast.LENGTH_SHORT).show()
                    cntClickWifi++
                }
                else{
                    val dialogConfirm= AlertDialog.Builder(requireContext())
                        .setTitle("Wifi connecting...")
                        .setMessage("Bạn có muốn tắt kết nối wifi không ?")
                        .setPositiveButton("Có"){_,_->

                        }
                        .setNegativeButton("Không"){dialog,_->
                            dialog.dismiss()
                        }

                    dialogConfirm.show()
                }
            }
            else{
                Toast.makeText(requireContext(),"xxx", Toast.LENGTH_SHORT).show()
                val dialogConnect= AlertDialog.Builder(requireContext())
                    .setMessage("Connect Wifi for ESP")
                    .setMessage("Bạn có muốn kết nối wifi cho esp không?")
                    .setPositiveButton("Có"){_,_->
                        openSmartConfigApp()
                        lifecycleScope.launch {
                            for(i in 1..20){
                                delay(15000)
                                gardenViewModel.getAllDataEsp(tokenAuth.toString()){}
                            }
                        }
                    }
                    .setNegativeButton("Không"){dialog,_->
                        dialog.dismiss()
                    }

                dialogConnect.show()
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

    private fun openSmartConfigApp(){
        val packageName = "com.haidang.iap2app"

        try {
            val intent = requireActivity()
                .packageManager.getLaunchIntentForPackage(packageName)

            if(intent != null){
                // Ứng dụng đã được cài đặt, mở trực tiếp
                startActivity(intent)
            }
            else{
                // Ứng dụng chưa được cài đặt, chuyển hướng đến Play Store
                // SỬA: Dùng chuỗi template Kotlin để đưa giá trị biến vào URL
                val intentGg = Intent(
                    Intent.ACTION_VIEW,
                    "https://play.google.com/store/apps/details?id=$packageName".toUri()
                )
                startActivity(intentGg)
                Toast.makeText(requireContext(), "App SmartConfig chưa được cài!", Toast.LENGTH_SHORT).show()
            }
        }catch (e: Exception){
            e.printStackTrace()
            Toast.makeText(requireContext(), "Không thể mở SmartConfig!", Toast.LENGTH_SHORT).show()
        }
    }
}